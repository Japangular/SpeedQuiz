package com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.service;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.model.Entry;
import jakarta.annotation.PostConstruct;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Unmarshaller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.StringReader;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DictionaryService {

  private final List<Entry> entries = new ArrayList<>();
  private final Map<String, List<Entry>> kebIndex = new HashMap<>();
  private final Map<String, List<Entry>> rebIndex = new HashMap<>();

  private static final Logger logger = LoggerFactory.getLogger(DictionaryService.class);
  String filename = "/app/jmdict_e.xml";

  @PostConstruct
  public void loadDictionary() throws Exception {
    logger.info("Loading Dictionary by parsing XML from " + filename + "...");
    File file = new File(filename);
    JAXBContext context = JAXBContext.newInstance(Entry.class);
    Unmarshaller unmarshaller = context.createUnmarshaller();

    try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
      StringBuilder entryXml = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        if (line.contains("<entry>")) {
          entryXml.setLength(0);
        }
        entryXml.append(line).append("\n");
        if (line.contains("</entry>")) {

          String xml = entryXml.toString();
          String cleanedXml = EntityReplacer.replaceEntities(xml);


          StringReader sr = new StringReader(cleanedXml);
          try {
            Entry entry = (Entry) unmarshaller.unmarshal(sr);
            entries.add(entry);
          } catch (JAXBException e) {
            System.err.println("Error parsing entry XML: " + e.getMessage());
            System.err.println("Problematic XML: " + cleanedXml);
            throw e;
          }

        }
      }
      logger.info("Dictionary loaded successfully. Loaded " + entries.size() + " entries");
    }

    buildIndex();
  }

  private void buildIndex() {
    long start = System.nanoTime();

    for (Entry entry : entries) {
      if (entry.getKEle() != null) {
        for (Entry.KElement k : entry.getKEle()) {
          if (k.getKeb() != null) {
            kebIndex.computeIfAbsent(k.getKeb(), x -> new ArrayList<>()).add(entry);
          }
        }
      }
      if (entry.getREle() != null) {
        for (Entry.RElement r : entry.getREle()) {
          if (r.getReb() != null) {
            rebIndex.computeIfAbsent(r.getReb(), x -> new ArrayList<>()).add(entry);
          }
        }
      }
    }

    long elapsed = System.nanoTime() - start;
    logger.info("Dictionary index built in {}ms — {} keb keys, {} reb keys",
        elapsed / 1_000_000, kebIndex.size(), rebIndex.size());
  }

  public List<Entry> searchEquals(String keyword) {
    Set<Entry> results = new LinkedHashSet<>();
    results.addAll(kebIndex.getOrDefault(keyword, List.of()));
    results.addAll(rebIndex.getOrDefault(keyword, List.of()));
    return results.stream().limit(20).toList();
  }

  public List<Entry> searchContains(String keyword) {
    return entries.stream()
        .filter(e ->
            Optional.ofNullable(e.getKEle())
                .orElse(Collections.emptyList())
                .stream()
                .anyMatch(k -> k.getKeb() != null && k.getKeb().contains(keyword)) ||

                Optional.ofNullable(e.getREle())
                    .orElse(Collections.emptyList())
                    .stream()
                    .anyMatch(r -> r.getReb() != null && r.getReb().contains(keyword))
        )
        .limit(20)
        .collect(Collectors.toList());
  }

}
