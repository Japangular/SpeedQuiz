package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@lombok.Data
@JsonIgnoreProperties(ignoreUnknown = true) // ignore all fields we don't need
public class WaniKaniAssignmentsResponse {
  List<Data> data;
  Page pages;

  @lombok.Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Page {
    @JsonProperty("total_count")
    Integer totalCount;

    @JsonProperty("per_page")
    Integer perPage;

    @JsonProperty("next_url")
    String nextUrl;

    @JsonProperty("previous_url")
    String previousUrl;
  }

  @lombok.Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class Data {
    @JsonProperty("data")
    Assignment assignment;

    @lombok.Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Assignment {
      @JsonProperty("subject_id")
      Integer subjectId;
      @JsonProperty("subject_type")
      String subjectType;
      @JsonProperty("srs_stage")
      Integer srsStage;

    }
  }
}
