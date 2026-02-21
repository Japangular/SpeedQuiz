package com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserTableStates {
  String[] rowIds;
  String deckname;
}
