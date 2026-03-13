package com.japangular.quizzingbydoing.backendspeed.deckPersistence;

import com.japangular.quizzingbydoing.backendspeed.persistence.deck.DeckRepository;
import com.japangular.quizzingbydoing.backendspeed.persistence.deck.UserDeckSource;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class UserDeckPersistenceAdapter implements UserDeckSource {
  private final DeckRepository repository;

  @Override
  public int insertDeck(String deckName, UUID uuid, String propertiesJson, String cardsJson) {
    return repository.insertDeck(deckName, uuid, propertiesJson, cardsJson);
  }
  // ...
}