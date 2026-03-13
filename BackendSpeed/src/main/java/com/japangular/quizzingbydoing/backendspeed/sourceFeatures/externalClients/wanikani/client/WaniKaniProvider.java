package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl.CardsFromUrlModel;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl.CardsFromUrlProvider;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WaniKaniProvider implements CardsFromUrlProvider {
  private static final Logger logger = LoggerFactory.getLogger(WaniKaniProvider.class);
  private final WaniKaniService waniKaniService;

  @Override
  public boolean isProviderForFrontendRequest(CardsFromUrlModel cardsFromUrlModel) {
    logger.info("isProviderForFrontendRequest: " + cardsFromUrlModel.getProvider().equalsIgnoreCase("wanikani"));
    return cardsFromUrlModel.getProvider().equalsIgnoreCase("wanikani");
  }

  public CardsFromUrlModel handleFrontendRequest(CardsFromUrlModel cardsFromUrlModel) {
    logger.info("handle frontend Request for cardsFromUrlModel: " + cardsFromUrlModel);

    // Skip UUID validation if we have a tokenHash (cached session flow)
    boolean hasTokenHash = cardsFromUrlModel.getTokenHash() != null
        && !cardsFromUrlModel.getTokenHash().isEmpty();

    if (!hasTokenHash && !extractAndValidateUUID(cardsFromUrlModel)) {
      cardsFromUrlModel.setConnectionTested(true);
      cardsFromUrlModel.setConnectionFailed(true);
      cardsFromUrlModel.setPayload(Map.of("error", "token had wrong format"));
      return cardsFromUrlModel;
    }
    if (waniKaniService.getUser(cardsFromUrlModel) &&
        waniKaniService.getAssignments(cardsFromUrlModel)) {
      cardsFromUrlModel.setConnectionTested(true);
      cardsFromUrlModel.setConnectionFailed(false);
      return cardsFromUrlModel;
    } else {
      cardsFromUrlModel.setConnectionTested(true);
      cardsFromUrlModel.setConnectionFailed(true);
      cardsFromUrlModel.setPayload(null);
      return cardsFromUrlModel;
    }
  }

  public static boolean extractAndValidateUUID(CardsFromUrlModel cardsFromUrlModel) {
    String authHeader = cardsFromUrlModel.getApiToken();
    if (authHeader == null || authHeader.isEmpty()) {
      return false;
    }

    // 1 & 2: Trim both ends and remove optional "Bearer" prefix (case-insensitive)
    String token = authHeader.replaceFirst("(?i)^Bearer\\s*", "").trim();

    // 3: Verify it's a valid UUID
    try {
      UUID uuid = UUID.fromString(token);  // throws IllegalArgumentException if invalid
      cardsFromUrlModel.setApiToken(uuid.toString()); // valid UUID string
      return true;
    } catch (IllegalArgumentException e) {
      return false;
    }
  }
}
