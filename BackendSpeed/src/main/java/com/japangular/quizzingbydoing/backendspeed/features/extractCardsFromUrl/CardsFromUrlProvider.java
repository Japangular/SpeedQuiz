package com.japangular.quizzingbydoing.backendspeed.features.extractCardsFromUrl;

public interface CardsFromUrlProvider {

  public boolean isProviderForFrontendRequest(CardsFromUrlModel cardsFromUrlModel);

  public CardsFromUrlModel handleFrontendRequest(CardsFromUrlModel cardsFromUrlModel);
}
