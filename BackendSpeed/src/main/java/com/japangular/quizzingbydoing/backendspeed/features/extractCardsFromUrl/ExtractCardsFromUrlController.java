package com.japangular.quizzingbydoing.backendspeed.features.extractCardsFromUrl;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/cardsFromUrl")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4300"})
@RequiredArgsConstructor
public class ExtractCardsFromUrlController {
  private static final Logger logger = LoggerFactory.getLogger(ExtractCardsFromUrlController.class);

  private final List<CardsFromUrlProvider> cardsFromUrlProviders;

  @PostMapping("/setUpConnection")
  public ResponseEntity<CardsFromUrlModel> setUpConnection(@RequestBody CardsFromUrlModel cardsFromUrlModel) {

    for (CardsFromUrlProvider provider : cardsFromUrlProviders) {
      if (provider.isProviderForFrontendRequest(cardsFromUrlModel)) {
        return ResponseEntity.ok(provider.handleFrontendRequest(cardsFromUrlModel));
      }
    }

    cardsFromUrlModel.setConnectionTested(true);
    cardsFromUrlModel.setConnectionFailed(true);
    cardsFromUrlModel.setPayload("provider not found");
    return ResponseEntity.ok(cardsFromUrlModel);
  }

}
