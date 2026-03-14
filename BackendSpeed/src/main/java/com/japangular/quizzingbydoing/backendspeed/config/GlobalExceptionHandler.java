package com.japangular.quizzingbydoing.backendspeed.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.exception.KanjiNotFoundException;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.externalClients.wanikani.client.exceptions.WaniKaniException;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.transcriptCards.exceptions.DuplicateTranscriptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  @ExceptionHandler(KanjiNotFoundException.class)
  public ResponseEntity<ApiError> handleKanjiNotFound(KanjiNotFoundException ex) {
    return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
  }

  @ExceptionHandler(DuplicateTranscriptException.class)
  public ResponseEntity<ApiError> handleDuplicateTranscript(DuplicateTranscriptException ex) {
    return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
  }

  @ExceptionHandler(WaniKaniException.class)
  public ResponseEntity<ApiError> handleWaniKani(WaniKaniException ex) {
    HttpStatus status = HttpStatus.resolve(ex.getStatusCode());
    if (status == null) status = HttpStatus.BAD_GATEWAY;
    return buildResponse(status, ex.getMessage());
  }

  @ExceptionHandler(JsonProcessingException.class)
  public ResponseEntity<ApiError> handleJsonProcessing(JsonProcessingException ex) {
    logger.warn("Invalid JSON in request: {}", ex.getOriginalMessage());
    return buildResponse(HttpStatus.BAD_REQUEST, "Invalid JSON format");
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
    return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleGeneric(Exception ex) {
    logger.error("Unhandled exception", ex);
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    String message = ex.getBindingResult().getFieldErrors().stream()
        .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
        .collect(Collectors.joining(", "));
    return buildResponse(HttpStatus.BAD_REQUEST, message);
  }

  private ResponseEntity<ApiError> buildResponse(HttpStatus status, String message) {
    ApiError error = ApiError.of(status.value(), status.getReasonPhrase(), message);
    return ResponseEntity.status(status).body(error);
  }
}