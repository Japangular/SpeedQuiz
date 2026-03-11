package com.japangular.quizzingbydoing.backendspeed.deckProviders;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckContent;
import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckPage;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.List;

@Service
public class DeckBrowsingService {

    public DeckPage getPage(DeckContent content, int limit, int offset, String filter) {
        List<Map<String, String>> cards = content.getCards();

        if (filter != null && !filter.trim().isEmpty()) {
            cards = filterCards(cards, filter);
        }

        int total = cards.size();

        int fromIndex = Math.min(offset, total);
        int toIndex = Math.min(offset + limit, total);
        List<Map<String, String>> page = cards.subList(fromIndex, toIndex);

        return new DeckPage(page, total, offset, limit);
    }

    private List<Map<String, String>> filterCards(List<Map<String, String>> cards, String filter) {
        return cards.stream()
                .filter(card -> card.values().stream()
                        .anyMatch(value -> value != null && value.contains(filter)))
                .toList();
    }
}
