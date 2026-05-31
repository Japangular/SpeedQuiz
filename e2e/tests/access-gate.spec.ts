import { test, expect } from '@playwright/test';
import { ProvisionPage } from '../pages/provision.page';

test.describe('Access gate', () => {
    test('blocks access when no token is present', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByText('Private Project')).toBeVisible();
        await expect(page.getByText(/invitation only/i)).toBeVisible();
    });

    test('grants access and shows provision screen with valid token', async ({ page }) => {
        const provision = new ProvisionPage(page);
        await provision.gotoWithToken('portfolio');
        await expect(page.getByText('Private Project')).not.toBeVisible();
        await expect(provision.displayNameInput).toBeVisible();
    });

    test('persists access across reloads via localStorage', async ({ page }) => {
        const provision = new ProvisionPage(page);
        await provision.gotoWithToken('vtuberfan');
        await page.reload();
        // Should still be past the gate even without the token in URL.
        await expect(page.getByText('Private Project')).not.toBeVisible();
        await expect(provision.welcomeHeading).toBeVisible();
    });

    test('rejects invalid tokens', async ({ page }) => {
        await page.goto('/?token=hacker123');
        await expect(page.getByText('Private Project')).toBeVisible();
    });
});