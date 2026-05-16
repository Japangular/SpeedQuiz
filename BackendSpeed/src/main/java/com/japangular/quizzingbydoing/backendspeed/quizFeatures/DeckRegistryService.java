package com.japangular.quizzingbydoing.backendspeed.quizFeatures;

import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.exception.DeckNotFoundException;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.adapters.UserDeckAdapter;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.model.DeckProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Facade that unifies all deck sources behind one API.
 * <p>
 * Three types of sources, three integration strategies:
 * <p>
 * 1. DeckProvider beans (auto-discovered via ApplicationContext)
 * → AnkiDeckAdapter, HtmlResourceDeckProvider
 * → These implement DeckProvider, so they're found automatically
 * <p>
 * 2. UserDeckAdapter (injected directly)
 * → Doesn't implement DeckProvider because it's multi-deck-per-user
 * → Called explicitly with ownerID context
 */
@Service
@RequiredArgsConstructor
public class DeckRegistryService {

  private final ApplicationContext context;
  private final UserDeckAdapter userDeckAdapter;

  private List<DeckProvider> getStaticProviders() {
    return new ArrayList<>(context.getBeansOfType(DeckProvider.class).values());
  }

  public List<DeckInfo> listDecks(UUID ownerId) {
    List<DeckInfo> result = new ArrayList<>();
    getStaticProviders().forEach(p -> result.add(p.getDeckInfo()));
    result.addAll(userDeckAdapter.listDecks(ownerId));
    return result;
  }

  public DeckContent loadDeck(String deckId, UUID ownerId) {
    if (userDeckAdapter.handles(deckId)) {
      return userDeckAdapter.loadDeck(deckId, ownerId);
    }
    return getStaticProviders().stream()
        .filter(p -> p.getDeckInfo().getId().equals(deckId))
        .findFirst().orElseThrow(() -> new DeckNotFoundException(deckId))
        .getDeckContent();
  }
}
