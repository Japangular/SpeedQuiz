package com.japangular.quizzingbydoing.backendspeed.persistence.deck;

public class DuplicateDeckException extends RuntimeException {
  public DuplicateDeckException(String deckName) {
    super("You already have a deck named '" + deckName + "'");
  }
}