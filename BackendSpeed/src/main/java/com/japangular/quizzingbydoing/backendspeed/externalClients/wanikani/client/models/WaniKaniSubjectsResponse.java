package com.japangular.quizzingbydoing.backendspeed.externalClients.wanikani.client.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WaniKaniSubjectsResponse {

  List<SubjectData> data;

  @Data
  @JsonIgnoreProperties(ignoreUnknown = true)
  public static class SubjectData {
    Integer id;
    String object; // "kanji", "vocabulary", "radical"

    @JsonProperty("data")
    SubjectContent content;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SubjectContent {
      Integer level;
      String characters;

      @JsonProperty("lesson_position")
      Integer lessonPosition;

      List<Meaning> meanings;
      List<Reading> readings; // null for radicals

      @Data
      @JsonIgnoreProperties(ignoreUnknown = true)
      public static class Meaning {
        String meaning;
        Boolean primary;
        @JsonProperty("accepted_answer")
        Boolean acceptedAnswer;
      }

      @Data
      @JsonIgnoreProperties(ignoreUnknown = true)
      public static class Reading {
        String reading;
        Boolean primary;
        @JsonProperty("accepted_answer")
        Boolean acceptedAnswer;
        String type; // "onyomi", "kunyomi", null for vocabulary
      }
    }
  }
}
