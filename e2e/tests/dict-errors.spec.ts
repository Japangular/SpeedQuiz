import {test, expect} from '../fixtures';

test.describe('Dictionary error handling', () => {
    test('shows a server-error snackbar when the API returns 500', async ({
                                                                              authenticatedPage,
                                                                              page,
                                                                              sideNavPage,
                                                                              dictPage,
                                                                          }) => {
        // The authenticatedPage fixture already ran mockBackend(), which registered
        // a 200 handler for /kanjiDict/search. Routes registered LATER take priority
        // in Playwright, so this 500 override wins for this test only — a clean way
        // to exercise a failure path without touching the shared mock file.
        await page.route('**/kanjiDict/search**', (route) =>
            route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: '{}',
            }),
        );

        await sideNavPage.navigateTo('Dictionary');
        await dictPage.search('水');

        // ErrorInterceptor maps status >= 500 to "Server error — please try again later".
        await expect(page.getByText(/server error/i)).toBeVisible();

        // And no results table should render on the error path.
        await expect(dictPage.resultsTable).not.toBeVisible();
    });
});