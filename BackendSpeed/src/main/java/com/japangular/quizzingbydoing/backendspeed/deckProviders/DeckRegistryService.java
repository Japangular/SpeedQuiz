package com.japangular.quizzingbydoing.backendspeed.deckProviders;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.adapters.UserDeckAdapter;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.adapters.WaniKaniDeckAdapter;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckProvider;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Facade that unifies all deck sources behind one API.
 *
 * Three types of sources, three integration strategies:
 *
 * 1. DeckProvider beans (auto-discovered via ApplicationContext)
 *    → AnkiDeckAdapter, HtmlResourceDeckProvider
 *    → These implement DeckProvider, so they're found automatically
 *
 * 2. UserDeckAdapter (injected directly)
 *    → Doesn't implement DeckProvider because it's multi-deck-per-user
 *    → Called explicitly with username context
 *
 * 3. WaniKaniDeckAdapter (injected directly)
 *    → Doesn't implement DeckProvider because it needs auth context
 *    → Called explicitly with token/session context
 */
@Service
@RequiredArgsConstructor
public class DeckRegistryService {

  private final ApplicationContext context;
    private final UserDeckAdapter userDeckAdapter;
    private final WaniKaniDeckAdapter waniKaniDeckAdapter;

    /**
     * Auto-discovers all beans implementing DeckProvider.
     * This finds AnkiDeckAdapter and all HtmlResourceDeckProviders
     * without this class ever importing them.
     */
    private List<DeckProvider> getStaticProviders() {
    return new ArrayList<>(
        context.getBeansOfType(DeckProvider.class).values());
  }

    /**
     * List all available decks from all sources.
     */
    public List<DeckInfo> listDecks(UUID ownerId, String wkClaimedName, String wkTokenHash) {
      List<DeckInfo> result = new ArrayList<>();

      getStaticProviders().forEach(p -> result.add(p.getDeckInfo()));

      result.addAll(userDeckAdapter.listDecks(ownerId));

      result.addAll(waniKaniDeckAdapter.listDecks(wkClaimedName, wkTokenHash));

      return result;
    }

  public DeckContent loadDeck(String deckId, UUID ownerId,
                              String wkClaimedName, String wkApiToken, String wkTokenHash) {

    if (userDeckAdapter.handles(deckId)) {
      return userDeckAdapter.loadDeck(deckId, ownerId);
    }

    if (waniKaniDeckAdapter.handles(deckId)) {
      return waniKaniDeckAdapter.loadDeck(wkClaimedName, wkApiToken, wkTokenHash);
    }

    return getStaticProviders().stream()
        .filter(p -> p.getDeckInfo().getId().equals(deckId))
        .findFirst()
        .orElseThrow(() -> new RuntimeException("Deck not found: " + deckId))
        .getDeckContent();
  }
}
