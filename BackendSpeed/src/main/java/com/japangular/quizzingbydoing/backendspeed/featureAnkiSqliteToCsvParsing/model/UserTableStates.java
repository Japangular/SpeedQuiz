package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserTableStates {
  String[] rowIds;
  String deckname;
}
