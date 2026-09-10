package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.persistence.session.ClaimCodeRequest;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.DeviceLinkException;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.DeviceLinkService;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.LinkCodeResponse;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.ProvisionResponse;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Pairing endpoints.
 *
 * POST /session/link/start   authenticated  -> issues a code for THIS session
 * POST /session/link/claim   unauthenticated -> exchanges a code for a token
 *
 * `claim` is deliberately unauthenticated: the whole point is that the calling
 * device has no token yet. That makes it the only guessable surface in the
 * session system, hence the rate limiter below.
 */
@RestController
@RequestMapping("/session/link")
@RequiredArgsConstructor
public class DeviceLinkController {

  private static final Logger logger = LoggerFactory.getLogger(DeviceLinkController.class);

  private final DeviceLinkService deviceLinkService;
  private final SessionService sessionService;

  private final ClaimRateLimiter rateLimiter = new ClaimRateLimiter(10, Duration.ofMinutes(1));

  @PostMapping("/start")
  public ResponseEntity<LinkCodeResponse> start(
      @RequestHeader(value = "X-Session-Token", required = false) String tokenHeader) {
    UUID ownerId = sessionService.requireOwner(tokenHeader);   // throws 401/400
    return ResponseEntity.ok(deviceLinkService.issue(ownerId));
  }

  @PostMapping("/claim")
  public ResponseEntity<ProvisionResponse> claim(
      @Valid @RequestBody ClaimCodeRequest request,
      HttpServletRequest httpRequest) {

    String client = clientKey(httpRequest);
    if (!rateLimiter.tryAcquire(client)) {
      logger.warn("Device link claim rate limit hit");
      throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
          "Too many attempts. Wait a minute and try again.");
    }

    try {
      return ResponseEntity.ok(deviceLinkService.claim(request.getCode()));
    } catch (DeviceLinkException e) {
      throw new ResponseStatusException(e.getStatus(), e.getMessage());
    }
  }

  /**
   * Behind the host nginx every request arrives from the proxy, so the raw
   * remote address is useless as a key. X-Forwarded-For is set by our own
   * nginx (and overwritten there, so a client cannot forge it) — but note
   * log-anon.conf anonymises what gets WRITTEN to logs, not what is passed
   * upstream, so this still discriminates between devices.
   */
  private String clientKey(HttpServletRequest request) {
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null && !forwarded.isBlank()) {
      return forwarded.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }

  /**
   * Sliding window, in memory. Deliberately not Bucket4j or Redis: this is a
   * single-instance deployment and the state is worthless across restarts.
   * If the backend is ever scaled horizontally this must move to the database.
   */
  static final class ClaimRateLimiter {
    private final int maxRequests;
    private final Duration window;
    private final Map<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    ClaimRateLimiter(int maxRequests, Duration window) {
      this.maxRequests = maxRequests;
      this.window = window;
    }

    boolean tryAcquire(String key) {
      Instant now = Instant.now();
      Instant cutoff = now.minus(window);

      Deque<Instant> timestamps = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
      synchronized (timestamps) {
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
          timestamps.pollFirst();
        }
        if (timestamps.size() >= maxRequests) {
          return false;
        }
        timestamps.addLast(now);
      }

      // Cheap unbounded-growth guard for a map that should never have many keys.
      if (hits.size() > 1000) {
        hits.entrySet().removeIf(entry -> {
          synchronized (entry.getValue()) {
            return entry.getValue().isEmpty()
                || entry.getValue().peekLast().isBefore(cutoff);
          }
        });
      }
      return true;
    }
  }
}
