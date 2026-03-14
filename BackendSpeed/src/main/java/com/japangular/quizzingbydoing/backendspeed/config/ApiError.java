package com.japangular.quizzingbydoing.backendspeed.config;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class ApiError {
  private int status;
  private String error;
  private String message;
  private Instant timestamp;

  public static ApiError of(int status, String error, String message) {
    return new ApiError(status, error, message, Instant.now());
  }
}
