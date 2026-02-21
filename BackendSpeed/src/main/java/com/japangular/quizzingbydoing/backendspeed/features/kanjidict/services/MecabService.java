package com.japangular.quizzingbydoing.backendspeed.features.kanjidict.services;

import com.japangular.quizzingbydoing.backendspeed.features.kanjidict.client.MecabClient;
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

  public List<Map<String, Object>> parseJapaneseToJson(String k) throws IOException {
    logger.info("Starting mecab parsing of: {}", k);

    // Get the raw result from the mecab client
    String result = mecabClient.parseJapanese(k);

    // Pre-process to replace the escape sequences for tab (\t) and newline (\n)
    String parsedResult = result.replace("\\t", "\t").replace("\\n", "\n");

    // Split result into lines (now correctly using actual \n)
    String[] lines = parsedResult.split("\n");

    List<Map<String, Object>> parsedData = new ArrayList<>();

    for (String line : lines) {
      line = line.trim();  // Clean up any extra spaces

      // Skip empty lines and EOS (End Of Sentence)
      if (line.isEmpty() || "EOS".equals(line)) {
        continue;
      }

      // Check for lines that contain the expected tab separator
      if (!line.contains("\t")) {
        logger.warn("Skipping malformed line (expected tab separator): {}", line);
        continue;
      }

      // Clean up unwanted punctuation or symbols
      line = line.replaceAll("[！ー]", "").trim(); // Remove exclamation marks and long dashes

      // Split each line by the tab character (\t)
      String[] parts = line.split("\t");

      // Skip lines that don't have the expected number of parts (surface + features)
      if (parts.length < 2) {
        logger.warn("Skipping line due to incorrect format: {}", line);
        continue;
      }
logger.info("mecab parts: " + parts[0]);
      // Extract surface form and features
      String surface = parts[0].contains("parsed") && parts[0].contains(":") ? parts[0].split(":")[1] : parts[0]; // Surface form
      if (parts[0].contains("parsed") && parts[0].contains(":")) {
        surface = surface.substring(1);
      }
      String features = parts[1]; // Features (comma-separated)

      // Split features by commas
      String[] featureArray = features.split(",");

      if (featureArray.length < 9) {
        featureArray = Arrays.copyOf(featureArray, 9);
        for (int i = 0; i < featureArray.length; i++) {
          if (featureArray[i] == null) {
            featureArray[i] = "*"; // or "UNKNOWN"
          }
        }
      }

      // Create a map for the feature tuple
      Map<String, String> featureMap = new HashMap<>();
      featureMap.put("partOfSpeech", featureArray[0]);
      featureMap.put("subClass1", featureArray[1]);
      featureMap.put("subClass2", featureArray[2]);
      featureMap.put("subClass3", featureArray[3]);
      featureMap.put("inflection", featureArray[4]);
      featureMap.put("conjugation", featureArray[5]);
      featureMap.put("rootForm", featureArray[6]);
      featureMap.put("reading", featureArray[7]);
      featureMap.put("pronunciation", featureArray[8]);

      // Add to the parsed data list
      Map<String, Object> wordData = new HashMap<>();
      wordData.put("surface", surface);
      wordData.put("features", featureMap);

      parsedData.add(wordData);
    }

    return parsedData;
  }
}
