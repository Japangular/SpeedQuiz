package com.japangular.quizzingbydoing.backendspeed.deckProviders;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckEntry;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckProvider;
import com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport.HtmlTableDeckImporter;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import lombok.RequiredArgsConstructor;

import java.io.FileInputStream;
import java.io.InputStream;

@RequiredArgsConstructor
public class HtmlResourceDeckProvider implements DeckProvider {

    private final DeckEntry entry;
    private final String attribution;
    private final String fullPath;
    private final HtmlTableDeckImporter importer;

    @Override
    public DeckInfo getDeckInfo() {
        return DeckInfo.builder()
            .id(entry.getId())
            .name(entry.getName())
            .description(entry.getDescription())
            .attribution(attribution)
            .build();
    }

    @Override
    public DeckContent getDeckContent() {
        try (InputStream in = new FileInputStream(fullPath)) {
            SubmissionDeck deck = importer.importHtml(in, entry.getName(), "system");
            return new DeckContent(deck.getProperties(), deck.getCards());
        } catch (Exception e) {
            throw new RuntimeException("Failed to load deck: " + entry.getId(), e);
        }
    }
}
