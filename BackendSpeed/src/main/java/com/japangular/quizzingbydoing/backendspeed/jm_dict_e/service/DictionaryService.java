package com.japangular.quizzingbydoing.backendspeed.jm_dict_e.service;

import com.japangular.quizzingbydoing.backendspeed.jm_dict_e.model.Entry;
import jakarta.annotation.PostConstruct;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Unmarshaller;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DictionaryService {

  private final List<Entry> entries = new ArrayList<>();
  String filename = "/app/jmdict_e.xml";

  @PostConstruct
  public void loadDictionary() throws Exception {
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
            entries.add(entry); // Add unmarshalled entry to the list
          } catch (JAXBException e) {
            // Catch and log the exception, then continue processing
            System.err.println("Error parsing entry XML: " + e.getMessage());
            System.err.println("Problematic XML: " + cleanedXml);
            throw e;
          }

        }
      }
      System.out.println("Loaded " + entries.size() + " entries");
    }
  }

  public List<Entry> searchEquals(String keyword) {
    return entries.stream()
        .filter(e ->
            Optional.ofNullable(e.getKEle())
                .orElse(Collections.emptyList())
                .stream()
                .anyMatch(k -> k.getKeb() != null && k.getKeb().equals(keyword)) ||

                Optional.ofNullable(e.getREle())
                    .orElse(Collections.emptyList())
                    .stream()
                    .anyMatch(r -> r.getReb() != null && r.getReb().equals(keyword))
        )
        .limit(20)
        .collect(Collectors.toList());
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
