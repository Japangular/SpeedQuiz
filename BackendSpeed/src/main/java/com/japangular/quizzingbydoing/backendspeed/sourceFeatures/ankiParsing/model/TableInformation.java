package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TableInformation {
  private int totalAvailableRows;
  private String[] columnNames;
}
