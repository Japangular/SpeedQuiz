package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppSession {
  private UUID token;
  private String displayName;
  private LocalDateTime createdAt;
  private LocalDateTime lastSeenAt;
}
