package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionService {

  private final SessionRepository sessionRepository;

  /** Resolves the owner from a session token, or throws 401/400. No anonymous fallback. */
  public UUID requireOwner(String tokenHeader) {
    if (tokenHeader == null || tokenHeader.isBlank()) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing session token");
    }
    final UUID token;
    try {
      token = UUID.fromString(tokenHeader);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Malformed session token");
    }
    return sessionRepository.findByToken(token)
        .map(AppSession::getToken)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown session token"));
  }
}