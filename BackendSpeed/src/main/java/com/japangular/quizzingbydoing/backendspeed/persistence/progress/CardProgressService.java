package com.japangular.quizzingbydoing.backendspeed.persistence.progress;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CardProgressService {

  private final CardProgressRepository repository;

  public List<CardProgress> getStates(String deckId, UUID ownerId) {
    return repository.getStates(deckId, ownerId);
  }

  public void updateStates(String deckId, UUID ownerId, List<CardProgress> states) {
    repository.saveStates(deckId, ownerId, states);
  }

  public void removeStates(String deckId, UUID ownerId, List<String> cardIds) {
    repository.deleteStates(deckId, ownerId, cardIds);
  }
}
