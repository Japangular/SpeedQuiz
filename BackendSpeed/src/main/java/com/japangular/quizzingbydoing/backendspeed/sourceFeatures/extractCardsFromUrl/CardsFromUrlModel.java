package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl;

import lombok.Data;

@Data
public class CardsFromUrlModel {
  private String provider;
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
