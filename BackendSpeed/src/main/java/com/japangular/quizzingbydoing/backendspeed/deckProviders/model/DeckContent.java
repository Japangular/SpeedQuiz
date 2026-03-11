package com.japangular.quizzingbydoing.backendspeed.deckProviders.model;

import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;
import java.util.List;

@AllArgsConstructor
@Data
public class DeckContent {
  Map<String, PropertyType> properties;
  List<Map<String, String>> cards;
}
