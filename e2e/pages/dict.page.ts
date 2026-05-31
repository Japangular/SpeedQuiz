import { Page, Locator } from '@playwright/test';

export class DictPage {
    readonly page: Page;
    readonly searchInput: Locator;
    readonly searchButton: Locator;
    readonly resultsTable: Locator;

    constructor(page: Page) {
        this.page = page;
        this.searchInput = page.getByLabel('Search Japanese word');
        // The search button has only an icon (no aria-label) — fall back to a CSS
        // locator scoped to the search field's suffix.
        this.searchButton = page.locator('mat-form-field button[mat-icon-button]');
        this.resultsTable = page.locator('mat-table');
    }

    async search(term: string): Promise<void> {
        await this.searchInput.fill(term);
        // Enter triggers search per the (keyup.enter)="triggerSearch()" binding.
        await this.searchInput.press('Enter');
    }
}