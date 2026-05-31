import { test, expect } from '../fixtures';

test.describe('Quiz flow', () => {
    test('loads a deck and shows the first card', async ({ authenticatedPage, page, deckShelfPage, quizPage }) => {
        await deckShelfPage.goto();
        await deckShelfPage.openDeck('JLPT N5 Vocab');

        // We landed at /quiz with a card displayed.
        await expect(page).toHaveURL(/\/quiz/);
        // First card's question is "水" (per MOCK_DECK_CONTENT order).
        await expect(quizPage.questionDisplay).toHaveText('水');
        // And the "Enter back" input should be present and focused.
        await expect(quizPage.answerInput('back')).toBeVisible();
    });

    test('advances to next card when correct answer is typed', async ({ authenticatedPage, page, deckShelfPage, quizPage }) => {
        await deckShelfPage.goto();
        await deckShelfPage.openDeck('JLPT N5 Vocab');

        await expect(quizPage.questionDisplay).toHaveText('水');

        // Card 水 has TWO answer fields — both must be solved to advance.
        await quizPage.submitAnswer('back', 'water');
        await quizPage.submitAnswer('reading', 'みず');


        await expect(quizPage.questionDisplay).toHaveText('本', { timeout: 5000 });
    });

    test('does not advance when answer is wrong', async ({ authenticatedPage, page, deckShelfPage, quizPage }) => {
        await deckShelfPage.goto();
        await deckShelfPage.openDeck('JLPT N5 Vocab');

        await expect(quizPage.questionDisplay).toHaveText('水');

        await quizPage.submitAnswer('back', 'banana');

        // Wait past the debounce window, then assert we're still on the same card.
        await page.waitForTimeout(500); // debounce is 300ms
        await expect(quizPage.questionDisplay).toHaveText('水');
    });
});