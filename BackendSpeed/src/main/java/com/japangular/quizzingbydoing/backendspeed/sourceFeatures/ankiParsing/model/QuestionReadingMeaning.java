package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@ToString
@AllArgsConstructor
public class QuestionReadingMeaning {
  private String index;
  private String question;
  private String reading;
  private String meaning;
}
