package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@lombok.Data
@JsonIgnoreProperties(ignoreUnknown = true) // ignore all fields we don't need
public class WaniKaniUserResponse {
  public Data data;

  @lombok.Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Data {
    private String username;
    private Subscription subscription;

    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Subscription {
      @JsonProperty("max_level_granted")
      private int maxLevelGranted;
      private boolean active;
      private String type;
      @JsonProperty("period_ends_at")
      private String periodEndsAt;
    }
  }
}
