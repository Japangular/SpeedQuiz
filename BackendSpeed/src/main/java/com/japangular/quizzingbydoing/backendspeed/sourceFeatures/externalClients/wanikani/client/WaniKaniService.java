package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.exceptions.WaniKaniException;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.models.*;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl.CardsFromUrlModel;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WaniKaniService {
  @Value("${app.wanikani.use-dev-cache:false}")
  private boolean useDevCache;

  private static final long CACHE_TTL_MINUTES = 15;

  /**
   * Simple wrapper that pairs a value with its cache timestamp.
   */
  private record TimedEntry<T>(T value, java.time.Instant cachedAt) {
    boolean isExpired() {
      return java.time.Instant.now().isAfter(cachedAt.plus(java.time.Duration.ofMinutes(CACHE_TTL_MINUTES)));
    }
  }

  // Permanent cache — subject data is public and static
  private final Map<Integer, WaniKaniSubjectData> subjectCache = new HashMap<>();
  // TTL caches — keyed by tokenHash (or claimedName as fallback)
  private final Map<String, TimedEntry<WaniKaniUserResponse>> userCache = new HashMap<>();
  private final Map<String, TimedEntry<List<Map<String, String>>>> assignmentsCache = new HashMap<>();

  private static final Logger logger = LoggerFactory.getLogger(WaniKaniService.class);

  private final WaniKaniClient waniKaniClient;
  private final WaniKaniMapper waniKaniMapper;

  public boolean getUser(CardsFromUrlModel cardsFromUrlModel) {
    if (cardsFromUrlModel.getClaimedName() == null)
      return false;

    String cacheKey = cardsFromUrlModel.getTokenHash();

    // 1. Try cache lookup by tokenHash
    if (cacheKey != null && userCache.containsKey(cacheKey)) {
      TimedEntry<WaniKaniUserResponse> entry = userCache.get(cacheKey);

      if (entry.isExpired()) {
        logger.info("User cache expired for '{}', removing.", cardsFromUrlModel.getClaimedName());
        userCache.remove(cacheKey);
      } else {
        WaniKaniUserResponse cached = entry.value();

        // Still verify claimedName matches the cached user
        if (cached.data.getUsername().equalsIgnoreCase(cardsFromUrlModel.getClaimedName().trim())) {
          logger.info("User '{}' verified from cache (tokenHash match).", cardsFromUrlModel.getClaimedName());
          cardsFromUrlModel.setConnectedUser(cached.data.getUsername());
          return true;
        } else {
          logger.warn("Cache hit for tokenHash but claimedName '{}' doesn't match cached user '{}'.",
              cardsFromUrlModel.getClaimedName(), cached.data.getUsername());
          return false;
        }
      }
    }

    // 2. No cache hit → need the real token to call WaniKani
    if (cardsFromUrlModel.getApiToken() == null || cardsFromUrlModel.getApiToken().isEmpty()) {
      logger.warn("No cached session and no apiToken provided. Cannot verify.");
      cardsFromUrlModel.setPayload("No token provided and no cached session found.");
      return false;
    }

    // 3. Call real WaniKani API
    WaniKaniUserResponse user;
    String json;
    try {
      json = waniKaniClient.getData(cardsFromUrlModel.getApiToken(), "user");
    } catch (WaniKaniException e) {
      logger.error("Failed to fetch WaniKani user: {}", e.getMessage());
      cardsFromUrlModel.setConnectedUser(null);
      cardsFromUrlModel.setPayload(e);
      return false;
    }

    try {
      if (json != null) {
        user = waniKaniMapper.mapUserResponse(json);
        logger.info("User '{}' loaded from real API.", cardsFromUrlModel.getClaimedName());
      } else {
        logger.error("User '{}' not found.", cardsFromUrlModel.getClaimedName());
        return false;
      }

      // being as restrictive as possible, until actual demands for monthly subscriptions appears
      WaniKaniVerificationStatus userStatus = WaniKaniVerificator.verifyUser(user, cardsFromUrlModel.getClaimedName());
      if (userStatus != WaniKaniVerificationStatus.USER_ACCEPTED) {
        logger.info("User failed verification: {}", userStatus);
        return false;
      }

      // 4. Cache by tokenHash if available, otherwise fall back to claimedName
      String key = cacheKey != null ? cacheKey : cardsFromUrlModel.getClaimedName();
      userCache.put(key, new TimedEntry<>(user, java.time.Instant.now()));
      cardsFromUrlModel.setConnectedUser(user.data.getUsername());
      return true;
    } catch (JsonProcessingException e) {
      logger.error("Converting user response failed");
      return false;
    }
  }

  public boolean getAssignments(CardsFromUrlModel cardsFromUrlModel) {
    String cacheKey = cardsFromUrlModel.getTokenHash();

    // 1. Try cache lookup by tokenHash
    if (cacheKey != null && assignmentsCache.containsKey(cacheKey)) {
      TimedEntry<List<Map<String, String>>> entry = assignmentsCache.get(cacheKey);

      if (entry.isExpired()) {
        logger.info("Assignments cache expired, removing.");
        assignmentsCache.remove(cacheKey);
      } else {
        logger.info("Assignments loaded from cache (tokenHash match).");
        cardsFromUrlModel.setPayload(entry.value());
        return true;
      }
    }

    // 2. No cache hit → need the real token
    String token = cardsFromUrlModel.getApiToken();
    if (token == null || token.isEmpty()) {
      logger.warn("No cached assignments and no apiToken provided.");
      cardsFromUrlModel.setPayload("No token provided and no cached assignments found.");
      return false;
    }

    String assignmentEndpoint = "assignments?subject_types=kanji&srs_stages=1,2,3,4,5,6,7,8";
    String json = waniKaniClient.getData(token, assignmentEndpoint);

    try {
      WaniKaniAssignmentsResponse assignmentsResponse =
          waniKaniMapper.mapAssignmentsResponse(json);

      // Get subject IDs from assignments
      List<Integer> subjectIds = assignmentsResponse.getData().stream()
          .map(WaniKaniAssignmentsResponse.Data::getAssignment)
          .filter(a -> a.getSrsStage() < 9 && "kanji".equals(a.getSubjectType()))
          .map(WaniKaniAssignmentsResponse.Data.Assignment::getSubjectId)
          .toList();

      // Ensure subjects are cached
      ensureSubjectsCached(token, subjectIds);

      // Convert to cards
      List<Map<String, String>> cards = subjectIds.stream()
          .map(subjectCache::get)
          .filter(Objects::nonNull)
          .map(subject -> {
            Map<String, String> card = new HashMap<>();
            card.put("question", subject.getCharacters());
            card.put("meaning", subject.getPrimaryMeaning());
            card.put("reading", subject.getPrimaryReading());
            return card;
          })
          .toList();

      logger.info("The deck of the assignments resulted in " + cards.size() + " cards");

      // 3. Cache by tokenHash
      String key = cacheKey != null ? cacheKey : cardsFromUrlModel.getClaimedName();
      assignmentsCache.put(key, new TimedEntry<>(cards, java.time.Instant.now()));

      cardsFromUrlModel.setPayload(cards);
      return true;

    } catch (JsonProcessingException e) {
      logger.error("Failed to parse assignments", e);
      return false;
    }
  }

  private void ensureSubjectsCached(String token, List<Integer> subjectIds) {
    logger.info("Checking if subject {} exists", subjectIds);
    if (useDevCache) {
      if (subjectCache.isEmpty()) {
        // Load from file once
        logger.info("Loading subjects from json cache file...");
        String json = loadFromFile("/dev-cache/wanikani_subjects.json");
        parseAndCache(json);
      }
      logger.info("devCache mode: tried to load subjects from json cache");
      return; // Don't hit API in dev mode
    }

    // Production: fetch only missing subjects
    List<Integer> missing = subjectIds.stream()
        .filter(id -> !subjectCache.containsKey(id))
        .toList();

    if (missing.isEmpty()) {
      logger.info("All subject {} found in cache", subjectIds);
      return;
    }
    logger.info("Missing subjects from dev cache file: {}", missing);

    String ids = missing.stream()
        .map(String::valueOf)
        .collect(Collectors.joining(","));

    String json = waniKaniClient.getData(token, "subjects?ids=" + ids);
    parseAndCache(json);
  }

  private String loadFromFile(String path) {
    try {
      InputStream is = getClass().getResourceAsStream(path);
      if (is == null) {
        throw new RuntimeException("Dev cache file not found: " + path
            + " - run curl to generate it first");
      }
      return new String(is.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new RuntimeException("Failed to read dev cache file: " + path, e);
    }
  }

  private void parseAndCache(String json) {
    try {
      WaniKaniSubjectsResponse response = waniKaniMapper.mapSubjectsResponse(json);

      response.getData().forEach(subjectData -> {
        WaniKaniSubjectData cached = new WaniKaniSubjectData();
        cached.setId(subjectData.getId());
        cached.setObjectType(subjectData.getObject());
        cached.setLevel(subjectData.getContent().getLevel());
        cached.setCharacters(subjectData.getContent().getCharacters());

        // Primary meaning
        if (subjectData.getContent().getMeanings() != null) {
          subjectData.getContent().getMeanings().stream()
              .filter(m -> Boolean.TRUE.equals(m.getPrimary()))
              .findFirst()
              .ifPresent(m -> cached.setPrimaryMeaning(m.getMeaning()));
        }

        // Primary reading
        if (subjectData.getContent().getReadings() != null) {
          subjectData.getContent().getReadings().stream()
              .filter(r -> Boolean.TRUE.equals(r.getPrimary()))
              .findFirst()
              .ifPresent(r -> cached.setPrimaryReading(r.getReading()));
        }

        subjectCache.put(cached.getId(), cached);
      });

      logger.info("Cached {} subjects, total cache size: {}",
          response.getData().size(), subjectCache.size());

    } catch (JsonProcessingException e) {
      logger.error("Failed to parse subjects response", e);
    }
  }
}
