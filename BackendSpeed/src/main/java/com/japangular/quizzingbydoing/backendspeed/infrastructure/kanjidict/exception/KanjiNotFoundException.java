package com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.exception;

public class KanjiNotFoundException extends RuntimeException {
  public KanjiNotFoundException(String message) {
    super(message);
  }
}
