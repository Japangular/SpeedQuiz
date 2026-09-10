package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

/**
 * Pairing codes for adopting an existing session on a second device.
 *
 * Design notes:
 *  - The alphabet excludes 0/O/1/I/L, so a code read off a laptop screen and
 *    typed on a phone cannot be mistyped in the usual ways. 27^6 is about
 *    387 million, which with the attempt cap and the endpoint rate limit puts
 *    brute force far outside the 5 minute window.
 *  - Only the SHA-256 of the code is stored. There is no reason for the server
 *    to be able to reproduce a live code, and a DB dump should not contain one.
 *  - SHA-256 without a work factor is correct here despite being wrong for
 *    passwords: the input is high-entropy and short-lived, so an offline
 *    dictionary attack has nothing to chew on.
 */
@Service
@RequiredArgsConstructor
public class DeviceLinkService {

  private static final Logger logger = LoggerFactory.getLogger(DeviceLinkService.class);

  /** No 0/O/1/I/L. Ambiguity costs more than the two bits it saves. */
  private static final char[] ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ".toCharArray();
  private static final int CODE_LENGTH = 6;
  private static final Duration TTL = Duration.ofMinutes(5);
  private static final int MAX_ATTEMPTS = 5;

  private final DeviceLinkRepository repository;
  private final SessionRepository sessionRepository;
  private final SecureRandom random = new SecureRandom();

  /**
   * Issues a code for an already-authenticated owner. Any previously issued
   * code for that owner stops working immediately.
   */
  public LinkCodeResponse issue(UUID ownerId) {
    repository.pruneExpired();

    String code = generateCode();
    LocalDateTime expiresAt = LocalDateTime.now().plus(TTL);
    repository.replaceForOwner(hash(code), ownerId, expiresAt);

    logger.info("Issued device link code for owner {} (expires {})", ownerId, expiresAt);

    long expiresAtMillis = expiresAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    return new LinkCodeResponse(format(code), expiresAtMillis, TTL.toSeconds());
  }

  /**
   * Exchanges a code for the session it points at. Single use: the code is
   * consumed by the first caller that wins the conditional UPDATE.
   */
  public ProvisionResponse claim(String rawCode) {
    String normalized = normalize(rawCode);
    if (normalized.length() != CODE_LENGTH) {
      throw new DeviceLinkException(HttpStatus.BAD_REQUEST);
    }

    String codeHash = hash(normalized);
    Optional<DeviceLinkCode> found = repository.findByHash(codeHash);

    if (found.isEmpty()) {
      // Nothing to increment — an unknown hash has no row. The endpoint rate
      // limiter is what defends this path.
      throw new DeviceLinkException(HttpStatus.NOT_FOUND);
    }

    DeviceLinkCode link = found.get();

    if (!repository.consume(codeHash, MAX_ATTEMPTS)) {
      // Expired, already consumed, or attempt cap reached. Count it either way.
      repository.recordFailedAttempt(codeHash);
      logger.warn("Rejected device link claim for owner {} (attempts now {})",
          link.getOwnerId(), link.getAttempts() + 1);
      throw new DeviceLinkException(HttpStatus.GONE);
    }

    AppSession session = sessionRepository.findByToken(link.getOwnerId())
        .orElseThrow(() -> new DeviceLinkException(HttpStatus.GONE));

    logger.info("Device link claimed for owner {}", link.getOwnerId());
    return new ProvisionResponse(session.getToken(), session.getDisplayName());
  }

  // ── internals ─────────────────────────────────────────────────────────────

  private String generateCode() {
    StringBuilder sb = new StringBuilder(CODE_LENGTH);
    for (int i = 0; i < CODE_LENGTH; i++) {
      sb.append(ALPHABET[random.nextInt(ALPHABET.length)]);
    }
    return sb.toString();
  }

  /** Display form: XYZ-ABC. Easier to read across a room than six run-on chars. */
  private String format(String code) {
    return code.substring(0, 3) + "-" + code.substring(3);
  }

  /**
   * Accepts whatever the user actually typed: hyphens, spaces, lower case.
   * Note this runs BEFORE hashing, so the stored hash is of the canonical form.
   */
  private String normalize(String input) {
    return input.replaceAll("[^A-Za-z0-9]", "").toUpperCase();
  }

  private String hash(String code) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(digest.digest(code.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }
}
