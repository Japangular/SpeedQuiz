package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.persistence.deck.DeckModel;
import org.junit.jupiter.api.Test;

import java.io.InputStream;

import static com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport.HtmlTableExtractorTest.TANOS;
import static org.junit.jupiter.api.Assertions.*;

class HtmlTableDeckImporterTest {

  @Test
  void shouldCreateSubmissionDeck() throws Exception {

    HtmlTableDeckImporter importer = new HtmlTableDeckImporter();

    try (InputStream in = getClass()
        .getClassLoader()
        .getResourceAsStream(TANOS[9])) {

      DeckModel deck = importer.importHtml(
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

        DeckModel deck = importer.importHtml(in, file, "tester");

        assertFalse(deck.getCards().isEmpty(),
            "Deck should not be empty for file: " + file);
      }
    }
  }
}
