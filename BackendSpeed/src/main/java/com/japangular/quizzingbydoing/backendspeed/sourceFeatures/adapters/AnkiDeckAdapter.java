package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.adapters;

import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.model.DeckProvider;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.model.QuestionReadingMeaning;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.services.FrontendCsvService;
import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
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
        return new DeckInfo()
            .id("anki-local")
            .name("Anki Collection")
            .description("Cards imported from local Anki SQLite database")
            .attribution("Local Anki DB");
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
