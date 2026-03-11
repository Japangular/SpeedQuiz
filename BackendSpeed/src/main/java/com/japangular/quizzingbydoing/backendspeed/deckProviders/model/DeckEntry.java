package com.japangular.quizzingbydoing.backendspeed.deckProviders.model;

import com.fasterxml.jackson.annotation.JsonProperty;
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
