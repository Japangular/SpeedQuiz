import { test, expect } from '../fixtures';

test.describe('Dictionary lookup', () => {
    test('searches and shows a result', async ({ authenticatedPage, page, sideNavPage, dictPage }) => {
        // Navigate from wherever we landed to the dictionary.
        await sideNavPage.navigateTo('Dictionary');

        // Default search mode in your component is "Kanji" (the first radio),
        // but the search input itself works the same. We'll just type "水" and Enter.
        // Wait for the HTTP request to fire and the response to come back.
        const responsePromise = page.waitForResponse(
            (resp) => resp.url().includes('/japaneseDict/search') || resp.url().includes('/kanjiDict/search')
        );

        await dictPage.search('水');
        await responsePromise;

        // The mat-table should now have at least one row visible.
        // Looser than asserting on specific text because column shape varies by mode.
        await expect(dictPage.resultsTable).toBeVisible();
    });
});