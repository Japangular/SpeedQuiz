package com.japangular.quizzingbydoing.backendspeed.frontendProviders.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.model.DeckCardState;
import com.japangular.quizzingbydoing.backendspeed.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.model.DeckInfo;
import com.japangular.quizzingbydoing.backendspeed.model.DeckPage;
import com.japangular.quizzingbydoing.backendspeed.persistence.deck.UserDeckSource;
import com.japangular.quizzingbydoing.backendspeed.persistence.progress.CardProgress;
import com.japangular.quizzingbydoing.backendspeed.persistence.progress.CardProgressService;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.DeckBrowsingService;
import com.japangular.quizzingbydoing.backendspeed.quizFeatures.DeckRegistryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DeckService {

  private final DeckRegistryService deckRegistry;
  private final DeckBrowsingService deckBrowsingService;
  private final CardProgressService cardProgressService;
  private final UserDeckSource userDeckSource;
  private final ObjectMapper objectMapper;

  public List<DeckInfo> listDecks(UUID ownerId, String wkClaimedName, String wkTokenHash) {
    return deckRegistry.listDecks(ownerId, wkClaimedName, wkTokenHash);
  }

  public DeckContent loadDeck(String deckId, UUID ownerId,
                              String wkClaimedName, String wkApiToken,
                              String wkTokenHash) {
    return deckRegistry.loadDeck(deckId, ownerId, wkClaimedName, wkApiToken, wkTokenHash);
  }

  public DeckPage browseDeck(String deckId, UUID ownerId,
                             Integer limit, Integer offset, String filter,
                             String wkClaimedName, String wkApiToken, String wkTokenHash) {
    DeckContent content = loadDeck(deckId, ownerId, wkClaimedName, wkApiToken, wkTokenHash);
    return deckBrowsingService.getPage(content, limit, offset, filter);
  }

  public void createDeck(String deckName, UUID ownerId, DeckContent deckContent) {
    try {
      String propertiesJson = objectMapper.writeValueAsString(deckContent.getProperties());
      String cardsJson = objectMapper.writeValueAsString(deckContent.getCards());
      userDeckSource.insertDeck(deckName, ownerId, propertiesJson, cardsJson);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Invalid deck content: " + e.getOriginalMessage(), e);
    }
  }

  public List<DeckCardState> getCardStates(String deckId, UUID ownerId) {
    return cardProgressService.getStates(deckId, ownerId).stream()
        .map(this::toDto)
        .toList();
  }

  public void updateCardStates(String deckId, UUID ownerId, List<DeckCardState> states) {
    List<CardProgress> entities = states.stream()
        .map(dto -> new CardProgress(dto.getDeckId(), dto.getCardId(), dto.getState()))
        .toList();
    cardProgressService.updateStates(deckId, ownerId, entities);
  }

  private DeckCardState toDto(CardProgress entity) {
    DeckCardState dto = new DeckCardState();
    dto.setDeckId(entity.getDeckId());
    dto.setCardId(entity.getCardId());
    dto.setState(entity.getState());
    return dto;
  }

  private CardProgress toEntity(DeckCardState dto) {
    return new CardProgress(dto.getDeckId(), dto.getCardId(), dto.getState());
  }
}