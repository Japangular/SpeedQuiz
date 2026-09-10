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
import java.util.Optional;
import java.util.UUID;

/**
 * Facade that unifies all deck sources behind one API.
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
      Optional<DeckContent> deckContent = userDeckAdapter.loadDeck(deckId, ownerId);
      if (deckContent.isPresent()) {
        return deckContent.get();
      }
    }
    return getStaticProviders().stream()
        .filter(p -> p.getDeckInfo().getId().equals(deckId))
        .findFirst().orElseThrow(() -> new DeckNotFoundException(deckId))
        .getDeckContent();
  }

  public void deleteDeck(String deckId, UUID ownerId) {
    if (!userDeckAdapter.handles(deckId)) {
      throw new DeckNotFoundException(deckId);   // built-in decks can't be deleted
    }
    if (userDeckAdapter.deleteDeck(deckId, ownerId) == 0) {
      throw new DeckNotFoundException(deckId);   // wrong owner or already gone
    }
  }

  /** DeckInfo for a user deck by name. No database read: the id is derived from the name. */
  public DeckInfo describeUserDeck(String deckName) {
    return userDeckAdapter.describe(deckName);
  }

  public DeckInfo updateDeck(String deckId, UUID ownerId, String propertiesJson, String cardsJson) {
    if (!userDeckAdapter.handles(deckId)) {
      throw new DeckNotFoundException(deckId);   // built-in decks are read-only
    }
    return userDeckAdapter.update(deckId, ownerId, propertiesJson, cardsJson);
  }
}

