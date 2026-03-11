package com.japangular.quizzingbydoing.features.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport.HtmlTableExtractor;
import com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport.TableData;
import org.junit.jupiter.api.Test;

import java.io.InputStream;

import static org.junit.jupiter.api.Assertions.*;

class HtmlTableExtractorTest {

  @Test
  void shouldExtractHeaderAndRows() throws Exception {

    HtmlTableExtractor extractor = new HtmlTableExtractor();

    try (InputStream in = getClass()
        .getClassLoader()
        .getResourceAsStream(TANOS[9])) {

      assertNotNull(in);

      TableData table = extractor.extract(in);

      assertFalse(table.getHeader().isEmpty());
      assertFalse(table.getRows().isEmpty());

      assertEquals("Kanji", table.getHeader().get(0));
      assertEquals("Hiragana", table.getHeader().get(1));
      assertEquals("English", table.getHeader().get(2));

      assertEquals("会う", table.getRows().getFirst().getFirst());
      assertEquals("あう", table.getRows().getFirst().get(1));
      assertEquals("to meet", table.getRows().getFirst().get(2));
    }
  }

  static final String[] TANOS = new String[]{
      "htmlTableImport/tanos/KanjiList.N1.html",
      "htmlTableImport/tanos/KanjiList.N2.html",
      "htmlTableImport/tanos/KanjiList.N3.html",
      "htmlTableImport/tanos/KanjiList.N4.html",
      "htmlTableImport/tanos/KanjiList.N5.html",
      "htmlTableImport/tanos/VocabList.N1.html",
      "htmlTableImport/tanos/VocabList.N2.html",
      "htmlTableImport/tanos/VocabList.N3.html",
      "htmlTableImport/tanos/VocabList.N4.html",
      "htmlTableImport/tanos/VocabList.N5.html"
  };
}
