package com.japangular.quizzingbydoing.backendspeed.featureAnkiSqliteToCsvParsing.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TableInformation {
  private int totalAvailableRows;
  private String[] columnNames;
}
