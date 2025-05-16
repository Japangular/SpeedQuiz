package com.japangular.quizzingbydoing.backendspeed.controller;

import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import com.japangular.quizzingbydoing.backendspeed.repository.SubmissionDeckRepository;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping()
@CrossOrigin(origins = "http://localhost:4200")
@AllArgsConstructor
public class SubmissionDeckController {

  private final SubmissionDeckRepository submissionDeckRepository;
  private static final Logger logger = LoggerFactory.getLogger(SubmissionDeckController.class);

  @PostMapping("/submission-deck")
  public ResponseEntity<Integer> create(@RequestBody SubmissionDeck submissionDeck) {
    logger.info("Incoming request to create SubmissionDeck: {}", submissionDeck);
    Integer savedDeck = submissionDeckRepository.insertSubmissionDeck(submissionDeck);
    logger.info("SubmissionDeck created with ID: {}", savedDeck);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedDeck);
  }
}
