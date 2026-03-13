package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport.model;

import lombok.Data;

import java.util.List;

@Data
public class DeckEntry {
  private String file;
  private String id;
  private String name;
  private String description;
  private List<String> tags;
}
