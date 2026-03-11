package com.japangular.quizzingbydoing.backendspeed.deckProviders.adapters;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckProvider;
import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.model.QuestionReadingMeaning;
import com.japangular.quizzingbydoing.backendspeed.features.ankiSqliteToCsvParsing.services.FrontendCsvService;
import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GoF Adapter Pattern — Object Adapter variant.
 *
 * Target:  DeckProvider (the interface DeckRegistryService expects)
 * Adaptee: FrontendCsvService (speaks in QuestionReadingMeaning)
 * Adapter: this class (translates QuestionReadingMeaning → SubmissionDeck)
 *
 * The adaptee (FrontendCsvService) is injected via constructor — composition,
 * not inheritance. The adapter does NOT extend FrontendCsvService.
 * The adaptee does NOT implement DeckProvider.
 * Each stays in its own world. Only this class knows both.
 */
@Component
@RequiredArgsConstructor
public class AnkiDeckAdapter implements DeckProvider {

    private final FrontendCsvService csvService;

    @Override
    public DeckInfo getDeckInfo() {
        return DeckInfo.builder()
            .id("anki-local")
            .name("Anki Collection")
            .description("Cards imported from local Anki SQLite database")
            .attribution("Local Anki DB")
            .build();
    }

    @Override
    public DeckContent getDeckContent() {
        List<QuestionReadingMeaning> ankiCards = csvService.getFilteredQrmList(null);

        Map<String, PropertyType> properties = new LinkedHashMap<>();
        properties.put("question", PropertyType.QUESTION);
        properties.put("reading", PropertyType.ANSWER);
        properties.put("meaning", PropertyType.ANSWER);

        List<Map<String, String>> cards = ankiCards.stream()
            .map(qrm -> {
                Map<String, String> card = new LinkedHashMap<>();
                card.put("question", qrm.getQuestion());
                card.put("reading", qrm.getReading());
                card.put("meaning", qrm.getMeaning());
                return card;
            })
            .toList();

        return new DeckContent(properties, cards);
    }
}
