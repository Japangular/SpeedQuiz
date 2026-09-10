package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import org.springframework.http.HttpStatus;

/**
 * Every failure mode carries the SAME client-facing message on purpose.
 * "Expired" vs "already used" vs "wrong" would let someone probing the
 * endpoint learn which guesses were near-misses.
 */
public class DeviceLinkException extends RuntimeException {
  private final HttpStatus status;

  public DeviceLinkException(HttpStatus status) {
    super("That code is not valid. Generate a new one on the other device.");
    this.status = status;
  }

  public HttpStatus getStatus() {
    return status;
  }
}