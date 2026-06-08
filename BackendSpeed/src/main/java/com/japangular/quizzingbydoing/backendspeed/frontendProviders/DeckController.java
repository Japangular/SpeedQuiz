package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.api.DeckApi;
import com.japangular.quizzingbydoing.backendspeed.frontendProviders.services.DeckService;
import com.japangular.quizzingbydoing.backendspeed.model.DeckCardState;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.DeckPage;
import com.japangular.quizzingbydoing.backendspeed.persistence.session.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class DeckController implements DeckApi {

  private final DeckService deckService;
  private final SessionService sessionService;

  @Override
  public ResponseEntity<List<DeckInfo>> listDecks(String xSessionToken) {
    return ResponseEntity.ok(deckService.listDecks(sessionService.requireOwner(xSessionToken)));
  }

  @Override
  public ResponseEntity<DeckContent> loadDeck(String deckId, String xSessionToken) {
    return ResponseEntity.ok(deckService.loadDeck(deckId, sessionService.requireOwner(xSessionToken)));
  }

  @Override
  public ResponseEntity<DeckPage> browseDeck(String deckId, String xSessionToken, Integer limit, Integer offset, String filter) {
    return ResponseEntity.ok(deckService.browseDeck(deckId, sessionService.requireOwner(xSessionToken), limit, offset, filter));
  }

  @Override
  public ResponseEntity<List<DeckCardState>> getCardStates(String deckId, String xSessionToken) {
    return ResponseEntity.ok(deckService.getCardStates(deckId, sessionService.requireOwner(xSessionToken)));
  }

  @Override
  public ResponseEntity<Void> updateCardStates(String deckId, String xSessionToken, List<DeckCardState> states) {
    deckService.updateCardStates(deckId, sessionService.requireOwner(xSessionToken), states);
    return ResponseEntity.ok().build();
  }

  @Override
  public ResponseEntity<Void> createDeck(String xSessionToken, String deckName, DeckContent deckContent) {
    deckService.createDeck(deckName, sessionService.requireOwner(xSessionToken), deckContent);
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @Override
  public ResponseEntity<Void> deleteDeck(String deckId, String xSessionToken) {
    deckService.deleteDeck(deckId, sessionService.requireOwner(xSessionToken));
    return ResponseEntity.noContent().build();
  }
}