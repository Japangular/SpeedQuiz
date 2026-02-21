package com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.model;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class QrmTableResponse {
  List<QuestionReadingMeaning> data;
  TableInformation info;
}

