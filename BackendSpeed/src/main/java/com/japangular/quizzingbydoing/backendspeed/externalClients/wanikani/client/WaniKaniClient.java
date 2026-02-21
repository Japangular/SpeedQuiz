package com.japangular.quizzingbydoing.backendspeed.externalClients.wanikani.client;

import com.japangular.quizzingbydoing.backendspeed.externalClients.wanikani.client.exceptions.WaniKaniException;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class WaniKaniClient {
  private static final Logger logger = LoggerFactory.getLogger(WaniKaniClient.class);
  private final WebClient webClient;

  public WaniKaniClient(WebClient.Builder webClientBuilder) {
    this.webClient = webClientBuilder.baseUrl("https://api.wanikani.com/v2").build();
  }

  /**
   * Fetch data from WaniKani API at the given endpoint
   *
   * @param token    WaniKani API token
   * @param endpoint API endpoint (e.g., "assignments", "user")
   * @return JSON string from API
   */
  public String getData(String token, String endpoint) {
    try {
      logger.info("Calling WaniKaniClient endpoint " + endpoint);
      String response = webClient.get()
          .uri("/" + endpoint)
          .header("Authorization", "Bearer " + token)
          .retrieve()
          .bodyToMono(String.class)
          .block();

      logger.info("WaniKani responded");

      return response;
    } catch (WebClientResponseException e) {
      throw new WaniKaniException(
          e.getStatusCode().value(),
          e.getResponseBodyAsString()
      );
    } catch (Exception e) {
      throw new WaniKaniException(500, "Unexpected WaniKani error");
    }
  }
}


