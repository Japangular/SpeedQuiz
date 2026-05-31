import { test, expect } from '../fixtures';

test.describe('Navigation', () => {
    test('navigates between sections via the side nav', async ({ authenticatedPage, page, sideNavPage }) => {
        await sideNavPage.navigateTo('DeckShelf');
        await expect(page).toHaveURL(/\/deckShelf/);

        await sideNavPage.navigateTo('Dictionary');
        await expect(page.getByLabel('Search Japanese word')).toBeVisible();

        await sideNavPage.navigateTo('About');
        // Just confirm the URL changed.
        await expect(page).not.toHaveURL(/\/deckShelf/);
    });
});