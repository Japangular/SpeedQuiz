package com.japangular.quizzingbydoing.backendspeed.infrastructure.kanjidict.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

@Service
public class MecabClient {
  private static final Logger logger = LoggerFactory.getLogger(MecabClient.class);

  public String parseJapanese(String input) {
    String url = "http://python_dict:8000/parse";
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    String body = String.format("{\"text\":\"%s\"}", input);
    HttpEntity<String> request = new HttpEntity<>(body, headers);

    RestTemplate restTemplate = new RestTemplate();
    ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

    logger.info("Response:");
    logger.info(response.getBody());

    return response.getBody();
  }
}
