import { Page, Locator, expect } from '@playwright/test';

export class ProvisionPage {
    readonly page: Page;
    readonly displayNameInput: Locator;
    readonly startLearningButton: Locator;
    readonly skipButton: Locator;
    readonly haveSaveFileButton: Locator;
    readonly welcomeHeading: Locator;

    constructor(page: Page) {
        this.page = page;
        this.welcomeHeading = page.getByText('Welcome to SpeedQuiz');
        this.displayNameInput = page.getByLabel('Display name');
        this.startLearningButton = page.getByRole('button', { name: 'Start learning' });
        this.skipButton = page.getByRole('button', { name: 'Skip' });
        this.haveSaveFileButton = page.getByRole('button', { name: 'I have a save file' });
    }

    /** Open the app with a valid access token. */
    async gotoWithToken(token: 'portfolio' | 'vtuberfan' = 'portfolio') {
        await this.page.goto(`/?token=${token}`);
        await expect(this.welcomeHeading).toBeVisible();
    }

    /** Provision a new profile with the given display name. */
    async createProfile(displayName: string) {
        await this.displayNameInput.fill(displayName);
        await this.startLearningButton.click();
        // Wait for the snackbar that confirms provisioning succeeded.
        await expect(
            this.page.getByText(new RegExp(`Welcome, ${displayName}`, 'i'))
        ).toBeVisible();
    }
}