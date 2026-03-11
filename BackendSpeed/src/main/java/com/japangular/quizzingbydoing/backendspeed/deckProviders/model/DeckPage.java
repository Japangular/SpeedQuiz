package com.japangular.quizzingbydoing.backendspeed.deckProviders.model;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Map;
import java.util.List;

@Data
@AllArgsConstructor
public class DeckPage {
    private List<Map<String, String>> cards;
    private int totalCards;
    private int offset;
    private int limit;
}
