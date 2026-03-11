package com.japangular.quizzingbydoing.backendspeed.deckProviders.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.DeckBrowsingService;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.DeckRegistryService;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.DeckStateService;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckCardState;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckPage;
import com.japangular.quizzingbydoing.backendspeed.features.quizFrontend.repository.SubmissionDeckRepository;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/quizApi/decks")
@RequiredArgsConstructor
public class DeckController {

  private static final UUID DEV_OWNER = UUID.fromString("00000000-0000-0000-0000-000000000001");

  private final DeckRegistryService deckRegistry;
  private final DeckBrowsingService deckBrowsingService;
  private final DeckStateService deckStateService;
  private final SubmissionDeckRepository submissionDeckRepository;

  private UUID resolveOwner(UUID ownerId) {
    return ownerId != null ? ownerId : DEV_OWNER;
  }

  @GetMapping
  public List<DeckInfo> listDecks(
      @RequestParam(required = false) UUID ownerId,
      @RequestParam(required = false) String wkClaimedName,
      @RequestParam(required = false) String wkTokenHash) {
    return deckRegistry.listDecks(resolveOwner(ownerId), wkClaimedName, wkTokenHash);
  }

  @GetMapping("/{deckId}")
  public DeckContent loadDeck(
      @PathVariable String deckId,
      @RequestParam(required = false) UUID ownerId,
      @RequestParam(required = false) String wkClaimedName,
      @RequestParam(required = false) String wkApiToken,
      @RequestParam(required = false) String wkTokenHash) {
    return deckRegistry.loadDeck(deckId, resolveOwner(ownerId), wkClaimedName, wkApiToken, wkTokenHash);
  }

  @GetMapping("/{deckId}/page")
  public DeckPage browseDeck(
      @PathVariable String deckId,
      @RequestParam(required = false) UUID ownerId,
      @RequestParam(defaultValue = "100") int limit,
      @RequestParam(defaultValue = "0") int offset,
      @RequestParam(required = false) String filter,
      @RequestParam(required = false) String wkClaimedName,
      @RequestParam(required = false) String wkApiToken,
      @RequestParam(required = false) String wkTokenHash) {
    DeckContent content = deckRegistry.loadDeck(deckId, resolveOwner(ownerId), wkClaimedName, wkApiToken, wkTokenHash);
    return deckBrowsingService.getPage(content, limit, offset, filter);
  }

  @GetMapping("/{deckId}/state")
  public List<DeckCardState> getCardStates(
      @PathVariable String deckId,
      @RequestParam(required = false) UUID ownerId) {
    return deckStateService.getStates(deckId, resolveOwner(ownerId));
  }

  @PostMapping("/{deckId}/state")
  public ResponseEntity<Void> updateCardStates(
      @PathVariable String deckId,
      @RequestParam(required = false) UUID ownerId,
      @RequestBody List<DeckCardState> states) {
    deckStateService.updateStates(deckId, resolveOwner(ownerId), states);
    return ResponseEntity.ok().build();
  }

  @PostMapping
  public ResponseEntity<Integer> createDeck(
      @RequestParam(required = false) UUID ownerId,
      @RequestParam String deckName,
      @RequestBody DeckContent deckContent) {
    try {
      ObjectMapper objectMapper = new ObjectMapper();
      String propertiesJson = objectMapper.writeValueAsString(deckContent.getProperties());
      String cardsJson = objectMapper.writeValueAsString(deckContent.getCards());

      int result = submissionDeckRepository.insertDeck(deckName, resolveOwner(ownerId), propertiesJson, cardsJson);
      return ResponseEntity.status(HttpStatus.CREATED).body(result);

    } catch (JsonProcessingException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(0);
    }
  }
}
