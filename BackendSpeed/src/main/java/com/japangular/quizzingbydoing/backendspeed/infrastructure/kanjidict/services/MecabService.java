package com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.services;

import com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.client.MecabClient;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;

@Service
@AllArgsConstructor
public class MecabService {
  private final MecabClient mecabClient;
  private static final Logger logger = LoggerFactory.getLogger(MecabService.class);

  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> parseJapaneseToJson(String k) {
    logger.info("Starting mecab parsing of: {}", k);

    List<Map<String, Object>> parsed = mecabClient.parseJapanese(k);

    // Flatten each {surface, features: {partOfSpeech, ...}}
    // into {surface, partOfSpeech, ...} for the frontend table
    List<Map<String, Object>> result = new ArrayList<>();
    for (Map<String, Object> word : parsed) {
      Map<String, Object> flat = new LinkedHashMap<>();
      flat.put("surface", word.get("surface"));

      Object featuresObj = word.get("features");
      if (featuresObj instanceof Map) {
        flat.putAll((Map<String, Object>) featuresObj);
      }

      result.add(flat);
    }

    logger.info("MeCab parsed {} tokens from input", result.size());
    return result;
  }
}
