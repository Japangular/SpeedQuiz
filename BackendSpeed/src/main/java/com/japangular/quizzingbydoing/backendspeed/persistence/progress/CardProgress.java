package com.japangular.quizzingbydoing.backendspeed.persistence.progress;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CardProgress {
    private String deckId;
    private String cardId;
    private String state;  // "ignored", "learned", "flagged"
}
