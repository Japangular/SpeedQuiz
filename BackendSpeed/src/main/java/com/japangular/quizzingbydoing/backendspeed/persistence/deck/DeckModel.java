package com.japangular.quizzingbydoing.backendspeed.persistence.deck;

import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class DeckModel {
  private String deckName;
  private String username;  // legacy — being replaced by owner_id UUID
  private Map<String, PropertyType> properties;
  private List<Map<String, String>> cards;
}
