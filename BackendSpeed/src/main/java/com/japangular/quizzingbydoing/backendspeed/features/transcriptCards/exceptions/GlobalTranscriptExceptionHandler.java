package com.japangular.quizzingbydoing.backendspeed.features.transcriptCards.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice  // Enables global handling of exceptions in REST controllers
public class GlobalTranscriptExceptionHandler {

  @ExceptionHandler(DuplicateTranscriptException.class)
  public ResponseEntity<String> handleDuplicateTranscript(DuplicateTranscriptException ex) {
    return ResponseEntity
        .status(HttpStatus.CONFLICT)  // 409
        .body(ex.getMessage());       // Or use a structured JSON response if preferred
  }

  // Optional: handle other transcript-related exceptions here
}
