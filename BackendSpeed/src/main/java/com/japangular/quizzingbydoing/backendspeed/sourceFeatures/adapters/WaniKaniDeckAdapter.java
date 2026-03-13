package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.adapters;

import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl.CardsFromUrlModel;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.WaniKaniProvider;
import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * GoF Adapter Pattern — session-dependent variant.
 *
 * This adapter cannot implement DeckProvider because loading a WaniKani
 * deck requires runtime authentication state (token, username).
 * DeckProvider.loadDeck() takes no arguments — it assumes the deck
 * is always available. WaniKani decks are only available when the
 * user has authenticated.
 *
 * Target:  DeckRegistryService's expectations
 * Adaptee: WaniKaniProvider (speaks in CardsFromUrlModel with auth flow)
 * Adapter: this class (translates auth-dependent API → SubmissionDeck)
 *
 * The adapter handles the translation of:
 *   CardsFromUrlModel.payload (List<Map<String, String>>) → SubmissionDeck
 *
 * It also encapsulates the knowledge of what WaniKani's payload shape
 * looks like, so the registry never needs to know.
 */
@Component
@RequiredArgsConstructor
public class WaniKaniDeckAdapter {

    private final WaniKaniProvider waniKaniProvider;

    private static final String ID_PREFIX = "wanikani:";

    /**
     * Returns deck info only if the user has a valid WaniKani session.
     * Returns empty list otherwise — the deck simply doesn't appear.
     */
    public List<DeckInfo> listDecks(String claimedName, String tokenHash) {
        if (claimedName == null || tokenHash == null) {
            return List.of();
        }

        // Check if we can reach WaniKani for this user
        // without actually loading all assignments
        return List.of(new DeckInfo()
                .id(ID_PREFIX + "assignments")
                .name("WaniKani Assignments")
                .description("Active kanji assignments from WaniKani")
                .attribution("WaniKani / " + claimedName));
    }

    /**
     * Load the WaniKani deck. Requires auth context.
     *
     * This is the core adaptation: CardsFromUrlModel's payload
     * is a List<Map<String, String>> with keys "question", "meaning", "reading".
     * We wrap that into a SubmissionDeck.
     */
    @SuppressWarnings("unchecked")
    public DeckContent loadDeck(String claimedName, String apiToken, String tokenHash) {
        CardsFromUrlModel model = new CardsFromUrlModel("wanikani", claimedName, apiToken);
        model.setTokenHash(tokenHash);

        CardsFromUrlModel result = waniKaniProvider.handleFrontendRequest(model);

        if (result.isConnectionFailed()) {
            throw new RuntimeException("WaniKani connection failed: " + result.getPayload());
        }

        @SuppressWarnings("unchecked")
        List<Map<String, String>> cards = (List<Map<String, String>>) result.getPayload();

        Map<String, PropertyType> properties = new LinkedHashMap<>();
        properties.put("question", PropertyType.QUESTION);
        properties.put("meaning", PropertyType.ANSWER);
        properties.put("reading", PropertyType.ANSWER);

        return new DeckContent(properties, cards);
    }

    public boolean handles(String deckId) {
        return deckId != null && deckId.startsWith(ID_PREFIX);
    }
}
