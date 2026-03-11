package com.japangular.quizzingbydoing.backendspeed.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Database row model for user_deck table.
 * Only used by SubmissionDeckRepository and HtmlTableDeckImporter.
 * Not exposed through the API — DeckContent is the public shape.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionDeck {
  private String deckName;
  private String username;  // legacy — being replaced by owner_id UUID
  private Map<String, PropertyType> properties;
  private List<Map<String, String>> cards;
}
