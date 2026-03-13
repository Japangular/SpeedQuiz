package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.apiModels;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ApiTranscriptRow {
  @JsonProperty("index")
  long index;
  @JsonProperty("transcript")
  String transcript;
  @JsonProperty("from")
  String from;
  @JsonProperty("to")
  String to;
  @JsonProperty("reading")
  String reading;
  @JsonProperty("meaning")
  String meaning;
  @JsonProperty("notes")
  String notes;
}
