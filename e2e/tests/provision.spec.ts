import { test, expect } from '../fixtures';

test.describe('Provision flow (mocked backend)', () => {
    test('creates a profile and lands in the app', async ({ mockedPage, page }) => {
        await mockedPage.provision.gotoWithToken('portfolio');
        await mockedPage.provision.createProfile('Akira');

        // Use role + exact name to disambiguate from "SpeedQuiz" in the toolbar.
        await expect(page.getByRole('link', { name: 'Quiz' })).toBeVisible();
    });

});