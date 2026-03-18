package com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EntryDto {
  private int entSeq;
  private List<String> kanji;
  private List<String> readings;
  private List<SenseDto> senses;

  @Data
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SenseDto {
    private List<String> glosses;
    private List<String> partsOfSpeech;
    private List<String> crossReferences;
    private List<String> antonyms;
    private List<String> misc;
  }
}