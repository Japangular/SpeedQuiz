package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.persistence.session.AppSession;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.ProvisionRequest;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.ProvisionResponse;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.SessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/session")
@RequiredArgsConstructor
public class SessionController {
  private final SessionRepository sessionRepository;
  private static final Logger logger = LoggerFactory.getLogger(SessionController.class);

  private static final Pattern SAFE_NAME = Pattern.compile("^[\\w\\- ]{1,30}$");

  @PostMapping("/provision")
  public ResponseEntity<ProvisionResponse> provision(@RequestBody ProvisionRequest request) {
    String name = request.getDisplayName();
    if (name == null || name.isBlank()) {
      return ResponseEntity.badRequest().build();
    }

    String sanitized = HtmlUtils.htmlEscape(name.trim());

    if (!SAFE_NAME.matcher(sanitized).matches()) {
      logger.warn("Rejected display name with invalid characters (length: {})", sanitized.length());
      return ResponseEntity.badRequest().build();
    }

    UUID token = sessionRepository.provision(sanitized);
    return ResponseEntity.status(HttpStatus.CREATED).body(new ProvisionResponse(token, sanitized));
  }

  @GetMapping("/validate")
  public ResponseEntity<ProvisionResponse> validate(@RequestHeader(value = "X-Session-Token", required = false) String tokenHeader) {
    if (tokenHeader == null || tokenHeader.isBlank()) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    UUID token;
    try {
      token = UUID.fromString(tokenHeader);
    } catch (IllegalArgumentException e) {
      return ResponseEntity.badRequest().build();
    }

    Optional<AppSession> session = sessionRepository.findByToken(token);
    return session
        .map(s -> ResponseEntity.ok(new ProvisionResponse(s.getToken(), HtmlUtils.htmlEscape(s.getDisplayName()))))
        .orElseGet(() -> ResponseEntity.notFound().build());
  }
}
