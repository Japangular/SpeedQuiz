package com.japangular.quizzingbydoing.backendspeed.quizFeatures.model;

import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;

public interface DeckProvider {

  DeckInfo getDeckInfo();
  DeckContent getDeckContent();

}
