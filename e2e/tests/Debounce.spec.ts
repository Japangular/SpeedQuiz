/**
 * debounce.spec.ts — Tests for the hiragana debounce slider.
 *
 * The bug this guards against:
 *   Typing "hachi" quickly with a debounce that is too short can fire the
 *   validator after "ha" (-> は). When the debounce re-fires for the full
 *   string, the romaji converter sees a leftover "i" context and produces
 *   "はい" instead of "はち" — the "ch" is effectively dropped.
 *
 * New UX behaviour (level-badge feature):
 *   Answer inputs are CSS-hidden until the user hovers over the quiz card.
 *   Every test must call revealInputs() before asserting input visibility.
 *
 * Mock deck:
 *   Property VALUES must match Angular PropertyType enum strings:
 *   'question', 'answer', 'hiragana'.
 *   Property KEYS become the mat-label text ("Enter <key>") used by
 *   QuizPage.answerInput() to locate the input element.
 */

import { test, expect, Page, Locator } from '@playwright/test';
import { ProvisionPage } from '../pages/provision.page';
import { DeckShelfPage } from '../pages/deck-shelf.page';
import { QuizPage } from '../pages/quiz.page';
import { mockBackend } from '../mocks/backend';

// ---------------------------------------------------------------------------
// Mock deck
// ---------------------------------------------------------------------------

const HACHI_DECK_ID = 'hachi-test';
const HACHI_DECK_CONTENT = {
    properties: {
        kanji:   'question',  // displayed as the prompt
        reading: 'hiragana',  // validated with exactHiraganaValidator
        meaning: 'answer',    // validated with levenshteinValidator
    },
    cards: [
        { kanji: '八', reading: 'はち', meaning: 'eight' },
        { kanji: '一', reading: 'いち', meaning: 'one'   },
    ],
};

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

async function mockBackendWithHachiDeck(page: Page): Promise<void> {
    await mockBackend(page);

    // Later-registered routes win — override the deck list.
    await page.route(/\/quizApi\/decks(\?|$)/, async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
                {
                    id: HACHI_DECK_ID,
                    name: 'Hachi Test Deck',
                    description: '八 / はち / eight',
                    attribution: 'test',
                },
            ]),
        });
    });

    await page.route(
        new RegExp(`/quizApi/decks/${HACHI_DECK_ID}(\\?|$)`),
        async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(HACHI_DECK_CONTENT),
            });
        },
    );

    // Return empty state so no prior session interferes.
    await page.route(
        new RegExp(`/quizApi/decks/${HACHI_DECK_ID}/state(\\?|$)`),
        async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
            } else {
                await route.fulfill({ status: 200, body: '' });
            }
        },
    );
}

async function setupHachiQuiz(page: Page): Promise<QuizPage> {
    await mockBackendWithHachiDeck(page);

    const provision = new ProvisionPage(page);
    await provision.gotoWithToken('portfolio');
    await provision.createProfile(`Debounce-${Date.now()}`);

    const deckShelf = new DeckShelfPage(page);
    await deckShelf.goto();
    await page.getByText('Hachi Test Deck', { exact: true }).click();
    await expect(page).toHaveURL(/\/quiz/);

    return new QuizPage(page);
}

/**
 * Hover over the question display to reveal CSS-hidden answer inputs.
 * Required after the level-badge feature introduced :hover-gated visibility.
 */
async function revealInputs(quiz: QuizPage): Promise<void> {
    await quiz.questionDisplay.hover();
}

// ---------------------------------------------------------------------------
// Deck-bar locators
// ---------------------------------------------------------------------------

/** Timer button: icon-button containing a "timer" mat-icon inside deck-bar. */
function timerButton(page: Page): Locator {
    return page
        .locator('app-deck-bar button[mat-icon-button]')
        .filter({ has: page.locator('mat-icon', { hasText: 'timer' }) });
}

/** Range input backing the mat-slider in the debounce row. */
function sliderThumb(page: Page): Locator {
    return page.locator('.debounce-row mat-slider input[type="range"]');
}

/** The "X ms" label next to the slider. */
function msLabel(page: Page, ms: number): Locator {
    return page.locator('.debounce-row').getByText(`${ms} ms`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Hiragana debounce slider', () => {

    test('timer button toggles the debounce slider into view', async ({ page }) => {
        await setupHachiQuiz(page);

        await expect(sliderThumb(page)).not.toBeVisible();

        await timerButton(page).click();
        await expect(sliderThumb(page)).toBeVisible();

        await timerButton(page).click();
        await expect(sliderThumb(page)).not.toBeVisible();
    });

    test('slider label updates when value changes', async ({ page }) => {
        await setupHachiQuiz(page);
        await timerButton(page).click();

        const slider = sliderThumb(page);
        await expect(slider).toBeVisible();

        const raw = await slider.inputValue();
        expect(Number(raw)).toBeGreaterThanOrEqual(100);
        expect(Number(raw)).toBeLessThanOrEqual(1000);

        await slider.fill('800');
        await expect(msLabel(page, 800)).toBeVisible();
    });

    test('debounce value survives a page reload', async ({ page }) => {
        await setupHachiQuiz(page);

        await timerButton(page).click();
        await sliderThumb(page).fill('650');
        await expect(msLabel(page, 650)).toBeVisible();

        await page.reload();
        await expect(page).toHaveURL(/\/quiz/);

        await timerButton(page).click();
        await expect(sliderThumb(page)).toHaveValue('650');
        await expect(msLabel(page, 650)).toBeVisible();
    });

    test('typing "hachi" at normal pace (80 ms/char) advances from 八 to 一', async ({ page }) => {
        const quiz = await setupHachiQuiz(page);
        await expect(quiz.questionDisplay).toHaveText('八');

        await revealInputs(quiz);
        const readingInput = quiz.answerInput('reading');

        await timerButton(page).click();
        await timerButton(page).click();
        await expect(readingInput).toBeVisible();

        // 80 ms gaps are inside the 300 ms debounce so the full word lands in one tick.
        await readingInput.type('hachi', { delay: 80 });
        await quiz.answerInput('meaning').fill('eight');

        await expect(quiz.questionDisplay).toHaveText('一', { timeout: 3000 });
    });

    test('typing "hachi" with no delay (0 ms) still produces はち', async ({ page }) => {
        const quiz = await setupHachiQuiz(page);
        await expect(quiz.questionDisplay).toHaveText('八');

        await revealInputs(quiz);
        const readingInput = quiz.answerInput('reading');

        await timerButton(page).click();
        await timerButton(page).click();
        await expect(readingInput).toBeVisible();

        // All chars in one tick; debounce fires once after 300 ms with full string.
        await readingInput.type('hachi', { delay: 0 });
        await quiz.answerInput('meaning').fill('eight');

        await expect(quiz.questionDisplay).toHaveText('一', { timeout: 3000 });
    });

    test('regression — fast "hachi" never resolves to はい (ch-drop bug)', async ({ page }) => {
        const quiz = await setupHachiQuiz(page);

        await timerButton(page).click();
        await timerButton(page).click();

        await expect(quiz.questionDisplay).toHaveText('八');

        await revealInputs(quiz);
        const readingInput = quiz.answerInput('reading');
        await expect(readingInput).toBeVisible();

        await readingInput.type('hachi', { delay: 0 });

        // Wait past the debounce window so the validator has fired.
        await page.waitForTimeout(600);

        // The meaning field keeps us on 八, so we can inspect the reading input.
        // exactHiraganaValidator writes the converted string back to the input.
        const inputValue = await readingInput.inputValue();
        expect(inputValue).not.toBe('はい');

        // Confirm we're still on 八 (reading solved, meaning still needed).
        await expect(quiz.questionDisplay).toHaveText('八');

        // Solve meaning — card must advance to 一.
        await quiz.answerInput('meaning').fill('eight');
        await expect(quiz.questionDisplay).toHaveText('一', { timeout: 3000 });
    });

    test('at 900 ms debounce the card does not advance until the window expires', async ({ page }) => {
        const quiz = await setupHachiQuiz(page);
        await expect(quiz.questionDisplay).toHaveText('八');

        // Hover first so inputs are revealed before the timer button steals focus.
        await revealInputs(quiz);

        await timerButton(page).click();
        await sliderThumb(page).fill('900');
        await timerButton(page).click();

        const readingInput = quiz.answerInput('reading');
        await expect(readingInput).toBeVisible();

        await readingInput.type('hachi', { delay: 0 });

        // 400 ms — still inside the 900 ms window — card must not have moved.
        await page.waitForTimeout(400);
        await expect(quiz.questionDisplay).toHaveText('八');

        // Let the full window expire, then solve meaning.
        await page.waitForTimeout(600); // total ~1000 ms > 900 ms debounce
        await quiz.answerInput('meaning').fill('eight');

        await expect(quiz.questionDisplay).toHaveText('一', { timeout: 2000 });
    });

    test('at 100 ms debounce, typing "hachi" with 120 ms gaps still works', async ({ page }) => {
        const quiz = await setupHachiQuiz(page);
        await expect(quiz.questionDisplay).toHaveText('八');

        // Hover first so inputs are revealed before the timer button steals focus.
        await revealInputs(quiz);

        await timerButton(page).click();
        await sliderThumb(page).fill('100');
        await timerButton(page).click();

        const readingInput = quiz.answerInput('reading');
        await expect(readingInput).toBeVisible();

        // 120 ms gaps > 100 ms debounce: every keystroke fires a validation attempt.
        // Partial states ("h", "ha", "hac", "hach") don't match はち, so only the
        // complete "hachi" succeeds. Maximum stress test for the ch-drop bug.
        await readingInput.type('hachi', { delay: 120 });
        await quiz.answerInput('meaning').fill('eight');

        await expect(quiz.questionDisplay).toHaveText('一', { timeout: 3000 });
    });

    test('card does not advance when only reading is solved', async ({ page }) => {
        const quiz = await setupHachiQuiz(page);

        await timerButton(page).click();
        await timerButton(page).click();
        await expect(quiz.questionDisplay).toHaveText('八');

        await revealInputs(quiz);
        const readingInput = quiz.answerInput('reading');
        await expect(readingInput).toBeVisible();

        await readingInput.type('hachi', { delay: 0 });
        await page.waitForTimeout(600); // let debounce fire

        // Reading solved, meaning still empty — must stay on 八.
        await expect(quiz.questionDisplay).toHaveText('八');

        await quiz.answerInput('meaning').fill('eight');
        await expect(quiz.questionDisplay).toHaveText('一', { timeout: 3000 });
    });
});