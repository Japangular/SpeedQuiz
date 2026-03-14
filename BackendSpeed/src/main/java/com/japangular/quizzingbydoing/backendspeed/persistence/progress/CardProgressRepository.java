package com.japangular.quizzingbydoing.backendspeed.persistence.progress;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Repository;

import org.springframework.jdbc.core.JdbcTemplate;

import java.util.UUID;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class CardProgressRepository {
  private final JdbcTemplate jdbcTemplate;

  public List<CardProgress> getStates(String deckId, UUID ownerId) {
    String sql = "SELECT deck_id, card_id, state FROM deck_card_state WHERE deck_id = ? AND owner_id = ?";
    return jdbcTemplate.query(sql, new Object[]{deckId, ownerId}, (rs, rowNum) ->
        new CardProgress(rs.getString("deck_id"), rs.getString("card_id"), rs.getString("state"))
    );
  }

  public void saveStates(String deckId, UUID ownerId, List<CardProgress> states) {
    String sql = """
        INSERT INTO deck_card_state (deck_id, card_id, owner_id, state, updated_at)
        VALUES (?, ?, ?, ?, NOW())
        ON CONFLICT (deck_id, card_id, owner_id)
        DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
        """;

    for (CardProgress state : states) {
      jdbcTemplate.update(sql, deckId, state.getCardId(), ownerId, state.getState());
    }
  }

  public void deleteStates(String deckId, UUID ownerId, List<String> cardIds) {
    if (cardIds.isEmpty()) return;

    // PostgreSQL specific
    String sql = """
        DELETE FROM deck_card_state
        WHERE deck_id = ?
          AND owner_id = ?
          AND card_id = ANY(?)
        """;

    jdbcTemplate.update(sql, deckId, ownerId, cardIds.toArray(new String[0]));
  }
}
