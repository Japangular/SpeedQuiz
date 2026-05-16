package com.japangular.quizzingbydoing.backendspeed.persistence.deck;

import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class DeckModel {
  private String deckName;
  private UUID ownerId;
  private Map<String, PropertyType> properties;
  private List<Map<String, String>> cards;
}
