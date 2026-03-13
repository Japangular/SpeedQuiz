package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.api.DeckApi;
import com.japangular.quizzingbydoing.backendspeed.model.DeckCardState;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.DeckPage;
import com.japangular.quizzingbydoing.backendspeed.persistence.progress.CardProgress;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.DeckBrowsingService;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.DeckRegistryService;
import com.japangular.quizzingbydoing.backendspeed.persistence.progress.CardProgressService;
import com.japangular.quizzingbydoing.backendspeed.persistence.deck.UserDeckSource;
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

  private final DeckRegistryService deckRegistry;
  private final DeckBrowsingService deckBrowsingService;
  private final CardProgressService cardProgressService;
  private final UserDeckSource userDeckSource;

  private UUID resolveOwner(UUID ownerId) {
    return ownerId != null ? ownerId : DEV_OWNER;
  }

    @Override
    public ResponseEntity<List<DeckInfo>> listDecks(
            UUID ownerId, String wkClaimedName, String wkTokenHash) {
        return ResponseEntity.ok(
            deckRegistry.listDecks(resolveOwner(ownerId), wkClaimedName, wkTokenHash));
  }

    @Override
    public ResponseEntity<DeckContent> loadDeck(
            String deckId, UUID ownerId, String wkClaimedName,
            String wkApiToken, String wkTokenHash) {
        return ResponseEntity.ok(
            deckRegistry.loadDeck(deckId, resolveOwner(ownerId),
                wkClaimedName, wkApiToken, wkTokenHash));
  }

    @Override
    public ResponseEntity<DeckPage> browseDeck(
            String deckId, UUID ownerId, Integer limit, Integer offset,
            String filter, String wkClaimedName, String wkApiToken,
            String wkTokenHash) {
    DeckContent content = deckRegistry.loadDeck(deckId, resolveOwner(ownerId), wkClaimedName, wkApiToken, wkTokenHash);
        return ResponseEntity.ok(
            deckBrowsingService.getPage(content, limit, offset, filter));
  }

  @Override
  public ResponseEntity<List<DeckCardState>> getCardStates(String deckId, UUID ownerId) {
    List<CardProgress> entities = cardProgressService.getStates(deckId, resolveOwner(ownerId));

    List<DeckCardState> response = entities.stream()
        .map(e -> {
          DeckCardState dto = new DeckCardState();
          dto.setDeckId(e.getDeckId());
          dto.setCardId(e.getCardId());
          dto.setState(e.getState());
          return dto;
        })
        .toList();

    return ResponseEntity.ok(response);
  }

  @Override
  public ResponseEntity<Void> updateCardStates(
      String deckId, UUID ownerId, List<DeckCardState> states) {
    List<CardProgress> entities = states.stream()
        .map(dto -> new CardProgress(dto.getDeckId(), dto.getCardId(), dto.getState()))
        .toList();

    cardProgressService.updateStates(deckId, resolveOwner(ownerId), entities);
    return ResponseEntity.ok().build();
  }

    @Override
    public ResponseEntity<Void> createDeck(
            UUID ownerId, String deckName, DeckContent deckContent) {
    try {
      ObjectMapper objectMapper = new ObjectMapper();
      String propertiesJson = objectMapper.writeValueAsString(deckContent.getProperties());
      String cardsJson = objectMapper.writeValueAsString(deckContent.getCards());
            userDeckSource.insertDeck(deckName, resolveOwner(ownerId), propertiesJson, cardsJson);
            return ResponseEntity.status(HttpStatus.CREATED).build();
    } catch (JsonProcessingException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
  }
}
