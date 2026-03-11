package com.japangular.quizzingbydoing.backendspeed.deckProviders.adapters;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.features.quizFrontend.repository.SubmissionDeckRepository;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * GoF Adapter Pattern — but for a multi-deck source.
 *
 * This adapter doesn't implement DeckProvider because the interface
 * assumes one provider = one deck. User-created decks are many-per-user.
 *
 * Instead, DeckRegistryService calls this adapter directly.
 * This is still an adapter: it translates SubmissionDeckRepository's
 * query-based API into the listing/loading contract the registry needs.
 *
 * Target:  DeckRegistryService's expectations (listDecks, loadDeck)
 * Adaptee: SubmissionDeckRepository (speaks in SQL queries and Optional)
 * Adapter: this class (translates repository calls → DeckInfo list + deck loading)
 *
 * Why not implement DeckProvider?
 * Because DeckProvider assumes getDeckId() returns ONE id.
 * This source has N decks per user. Forcing it into DeckProvider
 * would require one bean per user-deck — that's wrong.
 * Recognizing when a pattern doesn't fit is as important as applying it.
 */
@Component
@RequiredArgsConstructor
public class UserDeckAdapter {

    private final SubmissionDeckRepository repository;

    private static final String ID_PREFIX = "user:";

    public List<DeckInfo> listDecks(UUID ownerId) {
        return repository.getSubmissionDecksByOwnerId(ownerId).stream()
            .map(deck -> DeckInfo.builder()
                .id(ID_PREFIX + deck.getDeckName())
                .name(deck.getDeckName())
                .description("User-created deck")
                .attribution("user")
                .build())
            .toList();
    }

    public DeckContent loadDeck(String deckId, UUID ownerId) {
        String deckName = deckId.substring(ID_PREFIX.length());
        SubmissionDeck deck = repository.findByOwnerIdAndDeckName(ownerId, deckName)
            .orElseThrow(() -> new RuntimeException("User deck not found: " + deckId));
        return new DeckContent(deck.getProperties(), deck.getCards());
    }

    public boolean handles(String deckId) {
        return deckId != null && deckId.startsWith(ID_PREFIX);
    }
}
