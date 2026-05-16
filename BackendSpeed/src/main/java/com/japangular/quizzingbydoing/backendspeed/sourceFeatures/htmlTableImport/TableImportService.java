package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.persistence.deck.DeckModel;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class TableImportService {
  private final HtmlTableDeckImporter htmlTableDeckImporter;

  public DeckModel parseOne(String resourcePath, UUID ownerID) throws Exception {

    try (InputStream in = getClass()
        .getClassLoader()
        .getResourceAsStream(resourcePath)) {

      return htmlTableDeckImporter.importHtml(in, resourcePath, ownerID);
    }
  }

  public List<DeckModel> parseAll(List<String> resourcePaths, UUID ownerID) throws Exception {

    List<DeckModel> decks = new ArrayList<>();

    for (String path : resourcePaths) {
      decks.add(parseOne(path, ownerID));
    }

    return decks;
  }
}
