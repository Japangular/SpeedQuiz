package com.japangular.quizzingbydoing.backendspeed.persistence.deck;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Repository
public class DeckRepository {

  private final JdbcTemplate jdbcTemplate;
  private static final Logger logger = LoggerFactory.getLogger(DeckRepository.class);
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Autowired
  public DeckRepository(@Qualifier("postgresqlJdbcTemplate") JdbcTemplate postgresJdbcTemplate) {
    this.jdbcTemplate = postgresJdbcTemplate;
  }

  public int insertSubmissionDeck(DeckModel deckModel) {
    String propertiesJson;
    String cardsJson;

    try {
      propertiesJson = objectMapper.writeValueAsString(deckModel.getProperties());
      cardsJson = objectMapper.writeValueAsString(deckModel.getCards());
    } catch (JsonProcessingException e) {
      logger.error("JSON serialization error for SubmissionDeck", e);
      return 0;
    }

    String sql = "INSERT INTO deck (deck_name, username, properties, cards) VALUES (?, ?, ?::jsonb, ?::jsonb)";

    try {
      logger.info("Attempting to insert Deck with deckName: {}, username: {}", deckModel.getDeckName(), deckModel.getUsername());

      int rowsAffected = jdbcTemplate.update(sql,
          deckModel.getDeckName(),
          deckModel.getUsername(),
          propertiesJson,
          cardsJson);

      logger.info("Successfully inserted Deck with deckName: {}", deckModel.getDeckName());
      return rowsAffected;

    } catch (DuplicateKeyException e) {
      Throwable cause = e.getCause();
      if (cause instanceof PSQLException) {
        ServerErrorMessage serverError = ((PSQLException) cause).getServerErrorMessage();
        if (serverError != null && "unique_deck_content".equals(serverError.getConstraint())) {
          logger.warn("Duplicate deck submission detected for deckName: {} (ignored due to unique_deck_content constraint)", deckModel.getDeckName());
          return 2;
        }
      }

      logger.error("Unexpected duplicate key error for deckName: {}", deckModel.getDeckName(), e);
      throw e;
    } catch (DataAccessException e) {
      logger.error("Database error when inserting Deck with deckName: {}", deckModel.getDeckName(), e);
      return 0;
    }
  }

  public List<DeckModel> getSubmissionDecksByUsername(String username) {
    String sql = "SELECT deck_name, username, properties, cards FROM deck WHERE username = ?";
    return jdbcTemplate.query(sql, new Object[]{username}, (rs, rowNum) -> mapRowToDeck(rs));
  }

  public List<DeckModel> getSubmissionDecksByDeckName(String deckName) {
    String sql = "SELECT deck_name, username, properties, cards FROM deck WHERE deck_name = ?";
    return jdbcTemplate.query(sql, new Object[]{deckName}, (rs, rowNum) -> mapRowToDeck(rs));
  }

  public List<DeckModel> getSubmissionDecksByUsernameAndDeckName(String username, String deckName) {
    String sql = "SELECT deck_name, username, properties, cards FROM deck WHERE username = ? AND deck_name = ?";
    return jdbcTemplate.query(sql, new Object[]{username, deckName}, (rs, rowNum) -> mapRowToDeck(rs));
  }

  public Optional<DeckModel> findByUsernameAndDeckName(String username, String deckName) {
    List<DeckModel> decks = getSubmissionDecksByUsernameAndDeckName(username, deckName);
    if (decks.isEmpty()) {
      return Optional.empty();
    } else {
      return Optional.of(decks.getFirst());
    }
  }

  public List<DeckModel> getSubmissionDecksByOwnerId(UUID ownerId) {
    String sql = "SELECT deck_name, username, properties, cards FROM deck WHERE owner_id = ?";
    return jdbcTemplate.query(sql, new Object[]{ownerId}, (rs, rowNum) -> mapRowToDeck(rs));
  }

  public Optional<DeckModel> findByOwnerIdAndDeckName(UUID ownerId, String deckName) {
    String sql = "SELECT deck_name, username, properties, cards FROM deck WHERE owner_id = ? AND deck_name = ?";
    List<DeckModel> decks = jdbcTemplate.query(sql, new Object[]{ownerId, deckName}, (rs, rowNum) -> mapRowToDeck(rs));
    return decks.isEmpty() ? Optional.empty() : Optional.of(decks.getFirst());
  }

  public int insertDeck(String deckName, UUID ownerId, String propertiesJson, String cardsJson) {
    String sql = "INSERT INTO deck (deck_name, owner_id, properties, cards) VALUES (?, ?, ?::jsonb, ?::jsonb)";
    return jdbcTemplate.update(sql, deckName, ownerId, propertiesJson, cardsJson);
  }

  private DeckModel mapRowToDeck(ResultSet rs) throws SQLException {
    DeckModel deck = new DeckModel();
    deck.setDeckName(rs.getString("deck_name"));
    deck.setUsername(rs.getString("username"));

    try {
      Map<String, PropertyType> properties = objectMapper.readValue(rs.getString("properties"), new TypeReference<Map<String, PropertyType>>() {
      });
      List<Map<String, String>> cards = objectMapper.readValue(rs.getString("cards"), new TypeReference<List<Map<String, String>>>() {
      });

      deck.setProperties(properties);
      deck.setCards(cards);

    } catch (JsonProcessingException e) {
      logger.error("Failed to deserialize properties or cards for deck_name: {}", rs.getString("deck_name"), e);
    }

    return deck;
  }
  }