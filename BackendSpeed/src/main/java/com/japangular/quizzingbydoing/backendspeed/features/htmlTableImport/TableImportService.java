package com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@AllArgsConstructor
public class TableImportService {
  private final HtmlTableDeckImporter htmlTableDeckImporter;

  public SubmissionDeck parseOne(String resourcePath, String user) throws Exception {

    try (InputStream in = getClass()
        .getClassLoader()
        .getResourceAsStream(resourcePath)) {

      return htmlTableDeckImporter.importHtml(in, resourcePath, user);
    }
  }

  public List<SubmissionDeck> parseAll(List<String> resourcePaths, String user) throws Exception {

    List<SubmissionDeck> decks = new ArrayList<>();

    for (String path : resourcePaths) {
      decks.add(parseOne(path, user));
    }

    return decks;
  }
}
