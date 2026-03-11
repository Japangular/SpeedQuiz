package com.japangular.quizzingbydoing.features.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport.HtmlTableDeckImporter;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import org.junit.jupiter.api.Test;

import java.io.InputStream;

import static com.japangular.quizzingbydoing.features.htmlTableImport.HtmlTableExtractorTest.TANOS;
import static org.junit.jupiter.api.Assertions.*;

class HtmlTableDeckImporterTest {

  @Test
  void shouldCreateSubmissionDeck() throws Exception {

    HtmlTableDeckImporter importer = new HtmlTableDeckImporter();

    try (InputStream in = getClass()
        .getClassLoader()
        .getResourceAsStream(TANOS[9])) {

      SubmissionDeck deck = importer.importHtml(
          in,
          "JLPT N5 Vocab",
          "testuser"
      );

      assertEquals("JLPT N5 Vocab", deck.getDeckName());
      assertFalse(deck.getCards().isEmpty());

      assertFalse(deck.getProperties().isEmpty());

      var firstCard = deck.getCards().getFirst();

      assertTrue(firstCard.containsKey("Kanji"));
      assertTrue(firstCard.containsKey("Hiragana"));
      assertTrue(firstCard.containsKey("English"));
    }
  }

  @Test
  void shouldParseAllTestFiles() throws Exception {

    HtmlTableDeckImporter importer = new HtmlTableDeckImporter();

    for (String file : TANOS) {

      try (InputStream in = getClass()
          .getClassLoader()
          .getResourceAsStream(file)) {

        assertNotNull(in);

        SubmissionDeck deck = importer.importHtml(in, file, "tester");

        assertFalse(deck.getCards().isEmpty(),
            "Deck should not be empty for file: " + file);
      }
    }
  }
}
