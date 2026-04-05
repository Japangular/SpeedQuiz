import {computed, inject} from '@angular/core';
import {signalStore, withState, withComputed, withMethods, patchState, withHooks} from '@ngrx/signals';
import { DeckContent, PropertyType } from '../models/deck.model';
import {DeckShelfService} from '../features/deck-shelf/deck-shelf.service';
import {LocalProfileService} from '../user-store-management/local-profile.service';

export interface DeckStoreState {
  deck: DeckContent | null;
  deckName: string;
  deckId: string | undefined;
}

const initialState: DeckStoreState = {
  deck: null,
  deckName: '',
  deckId: undefined,
};

export const DeckStore = signalStore(
  { providedIn: 'root' },

  withState(initialState),

  withComputed((store) => ({
    properties: computed(() => store.deck()?.properties ?? {}),
    cards: computed(() => store.deck()?.cards ?? []),
    hasCards: computed(() => (store.deck()?.cards?.length ?? 0) > 0),
  })),

  withMethods((store) => ({
    loadDeck(deck: DeckContent, name: string, id?: string): void {
      patchState(store, { deck, deckName: name, deckId: id });
    },
    getCurrentDeckForSave(): { name: string; content: DeckContent } | null {
      const deck = store.deck();
      if (!deck) return null;
      return { name: store.deckName(), content: deck };
    },
  })),

  withHooks((store) => {
    const deckShelfService = inject(DeckShelfService);
    const localService = inject(LocalProfileService);

    return {
      onInit() {
        const last = localStorage.getItem('japangular_last_deck');
        if (last && store.cards().length === 0) {
          const { deckId, deckName } = JSON.parse(last);
          const ownerId = localService.getToken();
          if (ownerId) {
            deckShelfService.loadDeck(deckId, ownerId).subscribe(content => {
              store.loadDeck(content, deckName, deckId);
            });
          }
        }
      },
    };
  }),
);
