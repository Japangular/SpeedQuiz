package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@AllArgsConstructor
@Getter
public class TableData {
  private final List<String> header;
  private final List<List<String>> rows;
}
