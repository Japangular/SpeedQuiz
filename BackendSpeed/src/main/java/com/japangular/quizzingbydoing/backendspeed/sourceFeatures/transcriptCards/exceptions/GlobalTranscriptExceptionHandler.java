package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalTranscriptExceptionHandler {

  @ExceptionHandler(DuplicateTranscriptException.class)
  public ResponseEntity<String> handleDuplicateTranscript(DuplicateTranscriptException ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
  }
}
