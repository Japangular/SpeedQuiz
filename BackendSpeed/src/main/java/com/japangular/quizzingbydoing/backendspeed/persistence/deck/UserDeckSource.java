package com.japangular.quizzingbydoing.backendspeed.persistence.deck;

import java.util.UUID;

public interface UserDeckSource {

  int insertDeck(String deckName, UUID uuid, String propertiesJson, String cardsJson);
}
