package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CardsFromUrlModel {
  @NotBlank(message = "Provider is required")
  private String provider;

  @NotBlank(message = "Claimed name is required")
  @Size(max = 100)
  private String claimedName;

  private String apiToken;
  private String tokenHash;
  private boolean connectionTested = false;
  private boolean connectionFailed = false;
  private String connectedUser = "not logged in";
  private Object payload;

  public CardsFromUrlModel(String provider, String claimedName, String apiToken) {
    this.provider = provider;
    this.claimedName = claimedName;
    this.apiToken = apiToken;
  }
}