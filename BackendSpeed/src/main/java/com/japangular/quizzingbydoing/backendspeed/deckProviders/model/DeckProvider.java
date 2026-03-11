package com.japangular.quizzingbydoing.backendspeed.deckProviders.model;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;

public interface DeckProvider {

  DeckInfo getDeckInfo();
  DeckContent getDeckContent();

}
