package com.japangular.quizzingbydoing.backendspeed.session.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProvisionResponse {
  private UUID token;
  private String displayName;
}
