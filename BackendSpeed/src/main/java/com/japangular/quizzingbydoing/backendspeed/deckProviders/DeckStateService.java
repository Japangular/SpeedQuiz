package com.japangular.quizzingbydoing.backendspeed.deckProviders;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckCardState;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeckStateService {

    private final DeckStateRepository repository;

    public List<DeckCardState> getStates(String deckId, UUID ownerId) {
        return repository.getStates(deckId, ownerId);
    }

    public void updateStates(String deckId, UUID ownerId, List<DeckCardState> states) {
        repository.saveStates(deckId, ownerId, states);
    }

    public void removeStates(String deckId, UUID ownerId, List<String> cardIds) {
        repository.deleteStates(deckId, ownerId, cardIds);
    }
}
