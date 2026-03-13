package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.apiModels;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class ApiStreamTranscript {
  @JsonProperty("filename")
  String filename;
  @JsonProperty("stream_title")
  String streamTitle;
  @JsonProperty("vtuber")
  String vtuber;
  @JsonProperty("transcripts")
  private List<ApiTranscriptRow> transcripts;

  public String toString(){
    return "Filename: " + filename + "\n" +
        "streamTitle: " + streamTitle + "\n" +
        "vtuber: " + vtuber + "\n" +
        "number of transcript rows: " + transcripts.size() + "\n";
  }
}
