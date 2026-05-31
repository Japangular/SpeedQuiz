import { Page, Locator, expect } from '@playwright/test';

export class QuizPage {
    readonly page: Page;
    readonly questionDisplay: Locator;
    readonly historyPanel: Locator;

    constructor(page: Page) {
        this.page = page;
        // The display-slot renders the question as a span with class "display-text"
        // (for plain text) or "display-kanji" (for kanji). Match either.
        this.questionDisplay = page.locator('.display-text, .display-kanji').first();
        this.historyPanel = page.getByText('Recent cards');
    }

    /** Get the input for a specific field (e.g., 'back', 'reading'). */
    answerInput(fieldName: string): Locator {
        // The mat-label renders as "Enter <fieldName>" — getByLabel finds it.
        return this.page.getByLabel(`Enter ${fieldName}`);
    }

    /** Type an answer and wait for the input's value to settle. */
    async submitAnswer(fieldName: string, answer: string): Promise<void> {
        await this.answerInput(fieldName).fill(answer);
    }
}