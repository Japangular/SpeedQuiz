import { Page, Locator } from '@playwright/test';

export class SideNavPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    /** Click a nav item by its label (matches routes.ts data.label values). */
    async navigateTo(label: 'Quiz' | 'Dictionary' | 'Kanji Wall' | 'DeckShelf' | 'About' | 'Anki Import' | 'Deck Stepper' | 'Anki Table' | 'Transcripts' | 'Extract Cards') {
        await this.page.getByRole('link', { name: label }).click();
    }

    toggleButton(): Locator {
        return this.page.getByRole('button', { name: 'Toggle sidenav' });
    }
}