package com.japangular.quizzingbydoing.backendspeed.quizFeatures.exception;

public class DeckNotFoundException extends RuntimeException {
  public DeckNotFoundException(String deckId) {
    super("Deck not found: " + deckId);
  }
}
