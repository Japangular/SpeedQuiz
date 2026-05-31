import { test, expect } from '../fixtures';

test.describe('Responsive layout', () => {
    test.use({ viewport: { width: 375, height: 812 } }); // iPhone X size

    test('shows sidenav closed by default on mobile', async ({ authenticatedPage, page }) => {
        // On mobile (handset breakpoint), the sidenav should be in 'over' mode
        // and closed by default — meaning nav items are NOT in the DOM/visible.
        // The hamburger toggle button (aria-label="Toggle sidenav") opens it.
        const navLink = page.getByRole('link', { name: 'Quiz' });
        await expect(navLink).not.toBeVisible();

        // Open the sidenav via the hamburger.
        await page.getByRole('button', { name: 'Toggle sidenav' }).first().click();
        await expect(navLink).toBeVisible();
    });
});