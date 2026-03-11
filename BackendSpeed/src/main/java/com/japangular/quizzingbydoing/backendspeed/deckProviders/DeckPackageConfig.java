package com.japangular.quizzingbydoing.backendspeed.deckProviders;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckEntry;
import lombok.Data;

import java.util.List;

@Data
public class DeckPackageConfig {
    private String source;
    private String attribution;
    private boolean freeForAllUsersWithShoutout;
    private List<DeckEntry> decks;
}
