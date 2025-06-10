package com.japangular.quizzingbydoing.backendspeed.quizFrontend.controller;

import com.japangular.quizzingbydoing.backendspeed.model.DeckMetadata;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import com.japangular.quizzingbydoing.backendspeed.quizFrontend.repository.SubmissionDeckRepository;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/quizApi")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
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

  @GetMapping("/submission-deck")
  public ResponseEntity<SubmissionDeck> getSubmissionDeck(
      @RequestParam("username") String username,
      @RequestParam("deckName") String deckName) {

    Optional<SubmissionDeck> deck = submissionDeckRepository
        .findByUsernameAndDeckName(username, deckName);

    logger.info("Incoming request to get SubmissionDeck: {}", deck);
    return deck
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @GetMapping("/available-decks")
  public ResponseEntity<List<DeckMetadata>> availableDecksGet(@RequestParam("username") String username){
    List<DeckMetadata> decks =
        submissionDeckRepository
            .getSubmissionDecksByUsername(username)
            .stream()
            .map(deck -> new DeckMetadata(deck.getDeckName(), deck.getUsername(), deck.getProperties()))
            .toList();

    logger.info("There are {} available Decks found of user {}.", decks.size(), username);
    return ResponseEntity.status(HttpStatus.CREATED).body(decks);
  }
}
