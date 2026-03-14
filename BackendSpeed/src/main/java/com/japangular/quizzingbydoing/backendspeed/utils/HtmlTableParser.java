package com.japangular.quizzingbydoing.backendspeed.utils;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.jsoup.Jsoup.clean;

public class HtmlTableParser {

  public List<List<String>> parse(InputStream input) throws Exception {
    Document doc = Jsoup.parse(input, "UTF-8", "");
    Element table = doc.selectFirst("table");

    if (table == null) {
      throw new IllegalStateException("No table found in HTML.");
    }

    List<List<String>> rows = new ArrayList<>();
    Elements trElements = table.select("tr");

    for (Element tr : trElements) {
      Elements cells = tr.select("th, td");
      if (cells.isEmpty()) continue;
      List<String> row = new ArrayList<>();
      for (Element cell : cells) {
        String text = clean(cell.text());
        row.add(text);
      }
      rows.add(row);
    }
    return rows;
  }

  private String clean(String input) {
    if (input == null) return null;
    return input.replace("\u00A0", " "); // non-breaking space.trim();
  }
}
