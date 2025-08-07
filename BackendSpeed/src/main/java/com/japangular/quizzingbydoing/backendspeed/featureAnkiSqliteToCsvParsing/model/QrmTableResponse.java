package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class QrmTableResponse {
  List<QuestionReadingMeaning> data;
  TableInformation info;
}

