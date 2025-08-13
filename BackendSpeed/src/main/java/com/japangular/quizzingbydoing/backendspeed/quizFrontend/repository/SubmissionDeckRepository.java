package com.japangular.quizzingbydoing.backendspeed.quizFrontend.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
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

@Repository
public class SubmissionDeckRepository {

  private final JdbcTemplate jdbcTemplate;
  private static final Logger logger = LoggerFactory.getLogger(SubmissionDeckRepository.class);
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Autowired
  public SubmissionDeckRepository(@Qualifier("postgresqlJdbcTemplate") JdbcTemplate postgresJdbcTemplate) {
    this.jdbcTemplate = postgresJdbcTemplate;
  }

  public int insertSubmissionDeck(SubmissionDeck submissionDeck) {
    String propertiesJson;
    String cardsJson;

    try {
      propertiesJson = objectMapper.writeValueAsString(submissionDeck.getProperties());
      cardsJson = objectMapper.writeValueAsString(submissionDeck.getCards());
    } catch (JsonProcessingException e) {
      logger.error("JSON serialization error for SubmissionDeck", e);
      return 0;
    }

    String sql = "INSERT INTO submission_deck (deckName, username, properties, cards) VALUES (?, ?, ?::jsonb, ?::jsonb)";

    try {
      logger.info("Attempting to insert SubmissionDeck with deckName: {}, username: {}", submissionDeck.getDeckName(), submissionDeck.getUsername());

      int rowsAffected = jdbcTemplate.update(sql,
          submissionDeck.getDeckName(),
          submissionDeck.getUsername(),
          propertiesJson,
          cardsJson);

      logger.info("Successfully inserted SubmissionDeck with deckName: {}", submissionDeck.getDeckName());
      return rowsAffected;

    } catch (DuplicateKeyException e) {
      Throwable cause = e.getCause();
      if (cause instanceof PSQLException) {
        ServerErrorMessage serverError = ((PSQLException) cause).getServerErrorMessage();
        if (serverError != null && "unique_deck_content".equals(serverError.getConstraint())) {
          logger.warn("Duplicate deck submission detected for deckName: {} (ignored due to unique_deck_content constraint)", submissionDeck.getDeckName());
          return 2;
        }
      }

      logger.error("Unexpected duplicate key error for deckName: {}", submissionDeck.getDeckName(), e);
      throw e;
    } catch (DataAccessException e) {
      logger.error("Database error when inserting SubmissionDeck with deckName: {}", submissionDeck.getDeckName(), e);
      return 0;
    }
  }

  public List<SubmissionDeck> getSubmissionDecksByUsername(String username) {
    String sql = "SELECT deckName, username, properties, cards FROM submission_deck WHERE username = ?";

    return jdbcTemplate.query(sql, new Object[]{username}, (rs, rowNum) -> mapRowToSubmissionDeck(rs));
  }

  public List<SubmissionDeck> getSubmissionDecksByDeckName(String deckName) {
    String sql = "SELECT deckName, username, properties, cards FROM submission_deck WHERE deckName = ?";

    return jdbcTemplate.query(sql, new Object[]{deckName}, (rs, rowNum) -> mapRowToSubmissionDeck(rs));
  }

  public List<SubmissionDeck> getSubmissionDecksByUsernameAndDeckName(String username, String deckName) {
    String sql = "SELECT deckName, username, properties, cards FROM submission_deck WHERE username = ? AND deckName = ?";

    return jdbcTemplate.query(sql, new Object[]{username, deckName}, (rs, rowNum) -> mapRowToSubmissionDeck(rs));
  }

  public Optional<SubmissionDeck> findByUsernameAndDeckName(String username, String deckName) {
    List<SubmissionDeck> decks = getSubmissionDecksByUsernameAndDeckName(username, deckName);
    if (decks.isEmpty()) {
      return Optional.empty();
    } else {
      return Optional.of(decks.getFirst());
    }
  }

  private SubmissionDeck mapRowToSubmissionDeck(ResultSet rs) throws SQLException {


    SubmissionDeck deck = new SubmissionDeck();
    deck.setDeckName(rs.getString("deckName"));
    deck.setUsername(rs.getString("username"));

    try {
      Map<String, PropertyType> properties = objectMapper.readValue(rs.getString("properties"), new TypeReference<Map<String, PropertyType>>() {
      });
      List<Map<String, String>> cards = objectMapper.readValue(rs.getString("cards"), new TypeReference<List<Map<String, String>>>() {
      });

      deck.setProperties(properties);
      deck.setCards(cards);

    } catch (JsonProcessingException e) {
      logger.error("Failed to deserialize properties or cards for deckName: {}", rs.getString("deckName"), e);
      // Optionally rethrow or handle
    }

    return deck;
  }


}
