import { Page, Locator, expect } from '@playwright/test';

export class DeckShelfPage {
    readonly page: Page;
    readonly mixDecksButton: Locator;
    readonly startMixedQuizButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.mixDecksButton = page.getByRole('button', { name: 'Mix decks' });
        this.startMixedQuizButton = page.getByRole('button', { name: /Start mixed quiz/ });
    }

    /** Open the deck-shelf route directly. */
    async goto() {
        await this.page.goto('/deckShelf');
    }

// current — broken: ignores deckName, only ever clicks the JLPT row
    async openDeck(deckName: string) {
        await this.page.getByText(deckName, { exact: true }).click();
        await expect(this.page).toHaveURL(/\/quiz/);
    }

    /** Locator for any deck row by name (useful for assertions). */
    deckRow(deckName: string): Locator {
        return this.page.getByRole('listitem').filter({ hasText: deckName });
    }
}