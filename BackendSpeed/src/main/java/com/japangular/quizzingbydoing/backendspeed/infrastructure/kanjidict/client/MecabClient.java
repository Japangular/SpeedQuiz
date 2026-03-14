package com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MecabClient {
  private static final Logger logger = LoggerFactory.getLogger(MecabClient.class);
  private final ObjectMapper objectMapper;
  private final RestTemplate restTemplate;

  public List<Map<String, Object>> parseJapanese(String input) {
    String url = "http://python_dict:8000/parse";
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    Map<String, String> body = Map.of("text", input);
    HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

    logger.info("MeCab response received");

    try {
      JsonNode root = objectMapper.readTree(response.getBody());
      JsonNode parsed = root.get("parsed");
      return objectMapper.convertValue(parsed, new TypeReference<>() {
      });
    } catch (Exception e) {
      logger.error("Failed to parse MeCab response", e);
      return List.of();
    }
  }
}