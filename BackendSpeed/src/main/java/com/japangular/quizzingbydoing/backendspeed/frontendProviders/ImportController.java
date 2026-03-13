package com.japangular.quizzingbydoing.backendspeed.frontendProviders;

import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl.CardsFromUrlModel;
import com.japangular.quizzingbydoing.backendspeed.sourceFeatures.extractCardsFromUrl.CardsFromUrlProvider;
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
public class ImportController {
  private static final Logger logger = LoggerFactory.getLogger(ImportController.class);

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
