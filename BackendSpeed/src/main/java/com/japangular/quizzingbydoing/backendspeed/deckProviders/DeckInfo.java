package com.japangular.quizzingbydoing.backendspeed.deckProviders;

import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DeckInfo {
  private String id;
  private String name;
  private String description;
  private String attribution;
}
