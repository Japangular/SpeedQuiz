package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport.model.DeckEntry;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.model.DeckProvider;
import com.japangular.quizzingbydoing.backendspeed.persistence.deck.DeckModel;
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
        return new DeckInfo()
            .id(entry.getId())
            .name(entry.getName())
            .description(entry.getDescription())
            .attribution(attribution);
    }

    @Override
    public DeckContent getDeckContent() {
        try (InputStream in = new FileInputStream(fullPath)) {
            DeckModel deck = importer.importHtml(in, entry.getName(), "system");
            return new DeckContent(deck.getProperties(), deck.getCards());
        } catch (Exception e) {
            throw new RuntimeException("Failed to load deck: " + entry.getId(), e);
        }
    }
}
