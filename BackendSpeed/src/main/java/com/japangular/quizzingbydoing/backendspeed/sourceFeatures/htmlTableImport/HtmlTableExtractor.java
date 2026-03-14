package com.japangular.quizzingbydoing.backendspeed.sourceFeatures.htmlTableImport;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class HtmlTableExtractor {

  public TableData extract(InputStream input) throws Exception {
    Document doc = Jsoup.parse(input, "UTF-8", "");
    Elements tables = doc.select("table");

    if (tables.isEmpty()) {
      throw new IllegalStateException("No table found in HTML.");
    }

    Element table = tables.stream()
        .max(Comparator.comparingInt(t -> t.select("tr").size()))
        .orElseThrow();
    Elements trElements = table.select("tr");

    if (trElements.isEmpty()) {
      throw new IllegalStateException("Table has no rows.");
    }

    List<String> header = extractRow(trElements.getFirst());
    List<List<String>> rows = new ArrayList<>();

    for (int i = 1; i < trElements.size(); i++) {
      List<String> row = extractRow(trElements.get(i));
      if (!row.isEmpty()) {
        rows.add(row);
      }
    }
    return new TableData(header, rows);
  }

  private List<String> extractRow(Element tr) {
    Elements cells = tr.select("th, td");
    List<String> row = new ArrayList<>();

    for (Element cell : cells) {
      String text = clean(cell.text());
      row.add(text);
    }
    return row;
  }

  private String clean(String input) {
    if (input == null) return null;
    return input.replace("\u00A0", " ").trim();
  }
}
