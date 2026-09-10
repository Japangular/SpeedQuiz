package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LinkCodeResponse {
  /**
   * The plaintext code. Returned exactly once; never persisted.
   */
  private String code;
  /**
   * Epoch millis. The client renders a countdown from this.
   */
  private long expiresAt;
  /**
   * Seconds remaining at issue time, so a clock-skewed client still works.
   */
  private long expiresInSeconds;
}