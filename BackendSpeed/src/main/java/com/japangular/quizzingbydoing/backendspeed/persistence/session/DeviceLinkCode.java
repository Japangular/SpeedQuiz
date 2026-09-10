package com.japangular.quizzingbydoing.backendspeed.persistence.session;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeviceLinkCode {
  private String codeHash;
  private UUID ownerId;
  private LocalDateTime createdAt;
  private LocalDateTime expiresAt;
  private int attempts;
  private LocalDateTime consumedAt;
}