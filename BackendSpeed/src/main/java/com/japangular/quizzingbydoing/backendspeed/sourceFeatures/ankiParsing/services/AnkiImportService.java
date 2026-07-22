package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.ankiParsing.services;

import tools.jackson.databind.ObjectMapper;
import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import com.japangular.quizzingbydoing.backendspeed.persistence.deck.UserDeckSource;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;

import java.nio.file.Path;
import java.sql.*;
import java.util.*;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class AnkiImportService {

  private static final Logger log = LoggerFactory.getLogger(AnkiImportService.class);
  private static final String CSV_SEP = "\u001f"; // Constants.CSV_LINE_SEPARATOR
  private final UserDeckSource userDeckSource;
  private final ObjectMapper objectMapper;

  /**
   * Reads notes from an uploaded Anki .db (or the collection.anki21 inside a .apkg),
   * builds a DeckContent, and persists it as a user deck owned by ownerId.
   */
  public void importAnkiDb(Path sqliteFile, String deckName, UUID ownerId) {
    String url = "jdbc:sqlite:" + sqliteFile.toAbsolutePath()
        + "?open_mode=1"; // 1 = SQLITE_OPEN_READONLY

    List<Map<String, String>> cards = new ArrayList<>();

    try (Connection conn = DriverManager.getConnection(url);
         PreparedStatement ps = conn.prepareStatement("SELECT id, flds FROM notes");
         ResultSet rs = ps.executeQuery()) {

      int numberOfFields = 0;
      while (rs.next()) {
        String flds = rs.getString("flds");
        if (flds == null) continue;
        // Anki separates fields inside `flds` with U+001F, same as your CSV_LINE_SEPARATOR
        String[] parts = flds.split(CSV_SEP, -1);
        if (parts.length > numberOfFields) numberOfFields = parts.length;

        if (parts.length < 4) continue;
        if (Stream.of(parts[0], parts[1], parts[2], parts[3]).anyMatch(s -> s == null || s.isEmpty())) continue;

        Map<String, String> card = new LinkedHashMap<>();
        card.put("question", parts[1]);
        card.put("reading",  parts[2]);
        card.put("meaning",  parts[3]);
        cards.add(card);
      }
    } catch (SQLException e) {
      throw new IllegalArgumentException("Failed to read Anki SQLite: " + e.getMessage(), e);
    }

    Map<String, PropertyType> properties = new LinkedHashMap<>();
    properties.put("question", PropertyType.QUESTION);
    properties.put("reading",  PropertyType.ANSWER);
    properties.put("meaning",  PropertyType.ANSWER);

    try {
      String propsJson = objectMapper.writeValueAsString(properties);
      String cardsJson = objectMapper.writeValueAsString(cards);
      userDeckSource.insertDeck(deckName, ownerId, propsJson, cardsJson);
    } catch (JacksonException e) {
      throw new IllegalArgumentException("Could not serialise deck", e);
    }

    log.info("Imported {} cards from {} into deck '{}' for owner {}",
        cards.size(), sqliteFile.getFileName(), deckName, ownerId);
  }
}