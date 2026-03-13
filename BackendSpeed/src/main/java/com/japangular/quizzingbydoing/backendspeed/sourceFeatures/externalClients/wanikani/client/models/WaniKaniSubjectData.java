package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.models;

import lombok.Data;

@Data
public class WaniKaniSubjectData {
  private Integer id;
  private String objectType;    // "kanji", "vocabulary"
  private Integer level;
  private String characters;    // 愛, 恋愛
  private String primaryMeaning;
  private String primaryReading;
}
