package com.japangular.quizzingbydoing.backendspeed.features.htmlTableImport;

import com.japangular.quizzingbydoing.backendspeed.model.PropertyType;
import com.japangular.quizzingbydoing.backendspeed.model.SubmissionDeck;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;

@Service
public class HtmlTableDeckImporter {

  private final HtmlTableExtractor extractor;
  private final DefaultPropertyMapper propertyMapper;

  public HtmlTableDeckImporter() {
    this.extractor = new HtmlTableExtractor();
    this.propertyMapper = new DefaultPropertyMapper();
  }

  public SubmissionDeck importHtml(
      InputStream input,
      String deckName,
      String username
  ) throws Exception {

    TableData tableData = extractor.extract(input);

    List<String> header = tableData.getHeader();
    List<List<String>> rows = tableData.getRows();

    Map<String, PropertyType> properties = propertyMapper.map(header);

    List<Map<String, String>> cards = convertRows(header, rows);

    return new SubmissionDeck(
        deckName,
        username,
        properties,
        cards
    );
  }

  private List<Map<String, String>> convertRows(
      List<String> header,
      List<List<String>> rows
  ) {

    List<Map<String, String>> cards = new ArrayList<>();

    for (List<String> row : rows) {

      Map<String, String> card = new LinkedHashMap<>();

      for (int i = 0; i < header.size(); i++) {
        String key = header.get(i);
        String value = i < row.size() ? row.get(i) : "";
        card.put(key, value);
      }

      cards.add(card);
    }

    return cards;
  }
}
