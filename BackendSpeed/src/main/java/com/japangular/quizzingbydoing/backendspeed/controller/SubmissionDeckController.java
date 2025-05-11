package com.japangular.quizzingbydoing.backendspeed.controller;

import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import com.japangular.quizzingbydoing.backendspeed.repository.SubmissionDeckRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping()
@CrossOrigin(origins = "http://localhost:4200")
@AllArgsConstructor
public class SubmissionDeckController {

  private final SubmissionDeckRepository submissionDeckRepository;

  @PostMapping("/submission-deck")
  public ResponseEntity<SubmissionDeck> create(@RequestBody SubmissionDeck submissionDeck) {
    SubmissionDeck savedDeck = submissionDeckRepository.save(submissionDeck);
    return ResponseEntity.status(HttpStatus.CREATED).body(savedDeck);
  }
}
