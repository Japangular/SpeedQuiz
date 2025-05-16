package com.japangular.quizzingbydoing.backendspeed.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import lombok.AllArgsConstructor;
import org.postgresql.util.PSQLException;
import org.postgresql.util.ServerErrorMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@AllArgsConstructor
public class SubmissionDeckRepository {

  private final JdbcTemplate jdbcTemplate;
  private static final Logger logger = LoggerFactory.getLogger(SubmissionDeckRepository.class);

  public int insertSubmissionDeck(SubmissionDeck submissionDeck) {
    ObjectMapper objectMapper = new ObjectMapper();
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
}
