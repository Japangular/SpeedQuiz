package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.exceptions;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DuplicateTranscriptException extends RuntimeException {
  private static final Logger logger = LoggerFactory.getLogger(DuplicateTranscriptException.class);

  public DuplicateTranscriptException(String message) {
    super(message);
    logger.error(message);
  }
}
