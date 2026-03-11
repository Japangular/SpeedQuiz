package com.japangular.quizzingbydoing.backendspeed.deckProviders.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DeckCardState {
    private String deckId;
    private String cardId;
    private String state;  // "ignored", "learned", "flagged"
}
