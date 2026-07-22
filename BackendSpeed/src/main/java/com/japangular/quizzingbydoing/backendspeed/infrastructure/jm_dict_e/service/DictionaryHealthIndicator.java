package com.japangular.quizzingbydoing.backendspeed.infrastructure.jm_dict_e.service;

import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.stereotype.Component;

@Component
public class DictionaryHealthIndicator implements HealthIndicator {

  private final DictionaryService dictionaryService;

  public DictionaryHealthIndicator(DictionaryService dictionaryService) {
    this.dictionaryService = dictionaryService;
  }

  @Override
  public Health health() {
    int entries = dictionaryService.getEntryCount();
    if (entries == 0) {
      return Health.outOfService()
          .withDetail("reason", "JMdict not loaded — dictionary endpoints will return empty results")
          .build();
    }
    return Health.up().withDetail("entries", entries).build();
  }
}