package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport.model.DeckEntry;
import lombok.Data;

import java.util.List;

@Data
public class DeckPackageConfig {
    private String source;
    private String attribution;
    private boolean freeForAllUsersWithShoutout;
    private List<DeckEntry> decks;
}
