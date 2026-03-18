package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.api.DeckApi;
import com.japangular.quizzingbydoing.backendspeed.frontendProviders.services.DeckService;
import com.japangular.quizzingbydoing.backendspeed.model.DeckCardState;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.DeckPage;
import com.japangular.quizzingbydoing.backendspeed.persistence.deck.UserDeckSource;
import com.japangular.quizzingbydoing.backendspeed.persistence.progress.CardProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DeckController implements DeckApi {
  private static final UUID DEV_OWNER = UUID.fromString("00000000-0000-0000-0000-000000000001");

  private final DeckService deckService;
  private final CardProgressService cardProgressService;
  private final UserDeckSource userDeckSource;
  private final ObjectMapper objectMapper;

  private UUID resolveOwner(UUID ownerId) {
    return ownerId != null ? ownerId : DEV_OWNER;
  }

  @Override
  public ResponseEntity<List<DeckInfo>> listDecks(UUID ownerId, String wkClaimedName, String wkTokenHash) {
    return ResponseEntity.ok(deckService.listDecks(resolveOwner(ownerId), wkClaimedName, wkTokenHash));
  }

  @Override
  public ResponseEntity<DeckContent> loadDeck(String deckId, UUID ownerId, String wkClaimedName, String wkApiToken, String wkTokenHash) {
    return ResponseEntity.ok(deckService.loadDeck(deckId, resolveOwner(ownerId), wkClaimedName, wkApiToken, wkTokenHash));
  }

  @Override
  public ResponseEntity<DeckPage> browseDeck(String deckId, UUID ownerId, Integer limit, Integer offset, String filter, String wkClaimedName,
                                             String wkApiToken, String wkTokenHash) {
    return ResponseEntity.ok(deckService.browseDeck(deckId, resolveOwner(ownerId), limit, offset, filter, wkClaimedName, wkApiToken, wkTokenHash));
  }

  @Override
  public ResponseEntity<List<DeckCardState>> getCardStates(String deckId, UUID ownerId) {
    return ResponseEntity.ok(deckService.getCardStates(deckId, resolveOwner(ownerId)));
  }

  @Override
  public ResponseEntity<Void> updateCardStates(String deckId, UUID ownerId, List<DeckCardState> states) {
    deckService.updateCardStates(deckId, resolveOwner(ownerId), states);
    return ResponseEntity.ok().build();
  }

  @Override
  public ResponseEntity<Void> createDeck(UUID ownerId, String deckName, DeckContent deckContent) {
    deckService.createDeck(deckName, resolveOwner(ownerId), deckContent);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }
}