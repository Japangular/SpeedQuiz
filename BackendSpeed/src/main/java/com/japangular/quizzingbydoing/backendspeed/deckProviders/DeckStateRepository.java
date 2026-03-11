package com.japangular.quizzingbydoing.backendspeed.deckProviders;

import com.japangular.quizzingbydoing.backendspeed.deckProviders.model.DeckCardState;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;
import java.util.List;

@Repository
public class DeckStateRepository {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DeckStateRepository(@Qualifier("postgresqlJdbcTemplate") JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DeckCardState> getStates(String deckId, UUID ownerId) {
        String sql = "SELECT deck_id, card_id, state FROM deck_card_state WHERE deck_id = ? AND owner_id = ?";
        return jdbcTemplate.query(sql, new Object[]{deckId, ownerId}, (rs, rowNum) ->
            new DeckCardState(rs.getString("deck_id"), rs.getString("card_id"), rs.getString("state"))
        );
    }

    public void saveStates(String deckId, UUID ownerId, List<DeckCardState> states) {
        String sql = """
            INSERT INTO deck_card_state (deck_id, card_id, owner_id, state, updated_at)
            VALUES (?, ?, ?, ?, NOW())
            ON CONFLICT (deck_id, card_id, owner_id)
            DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
            """;

        for (DeckCardState state : states) {
            jdbcTemplate.update(sql, deckId, state.getCardId(), ownerId, state.getState());
        }
    }

    public void deleteStates(String deckId, UUID ownerId, List<String> cardIds) {
        if (cardIds.isEmpty()) return;

        String placeholders = String.join(",", cardIds.stream().map(id -> "?").toList());
        String sql = "DELETE FROM deck_card_state WHERE deck_id = ? AND owner_id = ? AND card_id IN (" + placeholders + ")";

        Object[] params = new Object[2 + cardIds.size()];
        params[0] = deckId;
        params[1] = ownerId;
        for (int i = 0; i < cardIds.size(); i++) {
            params[i + 2] = cardIds.get(i);
        }

        jdbcTemplate.update(sql, params);
    }
}
