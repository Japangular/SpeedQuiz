import {Page} from '@playwright/test';

/**
 * Fixed values used by mocks so tests can assert against them.
 * Exporting them lets test files import for assertions like:
 *   expect(...).toContainText(MOCK_DECKS[0].name)
 */
export const MOCK_SESSION_TOKEN = '11111111-1111-1111-1111-111111111111';

export const MOCK_DECKS = [
    {
        id: 'jlpt-n5-vocab',
        name: 'JLPT N5 Vocab',
        description: 'Common N5-level vocabulary',
        attribution: 'Built-in',
    },
    {
        id: 'hiragana-basics',
        name: 'Hiragana Basics',
        description: 'All 46 base hiragana',
        attribution: 'Built-in',
    },
];

export const MOCK_DECK_CONTENT: Record<string, unknown> = {
    'jlpt-n5-vocab': {
        properties: {
            front: 'question',
            back: 'answer',
            reading: 'hiragana',
        },
        cards: [
            {front: '水', back: 'water', reading: 'みず'},
            {front: '本', back: 'book', reading: 'ほん'},
            {front: '人', back: 'person', reading: 'ひと'},
        ],
    },
    'hiragana-basics': {
        properties: {
            front: 'question',
            back: 'hiragana',
        },
        cards: [
            {front: 'a', back: 'あ'},
            {front: 'i', back: 'い'},
        ],
    },
};

export const MOCK_DICT_RESULTS: Record<string, unknown[]> = {
    '水': [{
        word: '水',
        reading: 'みず',
        meanings: ['water', 'cold water', 'fluid'],
        pos: ['noun'],
    }],
};

export const MOCK_KANJI_RESULTS: Record<string, unknown[]> = {
    '水': [{
        kanji: '水',
        onyomi: ['スイ'],
        kunyomi: ['みず'],
        meanings: ['water'],
    }],
};

/**
 * Install all backend mocks on a Playwright page.
 * Call this BEFORE page.goto() — Playwright applies routes to every
 * subsequent network request.
 */
export async function mockBackend(page: Page): Promise<void> {
    // POST /session/provision — accept any display name, return canned token.
    await page.route('**/session/provision', async (route) => {
        if (route.request().method() !== 'POST') {
            return route.fallback();
        }
        const body = route.request().postDataJSON() as { displayName: string };
        await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
                token: MOCK_SESSION_TOKEN,
                displayName: body.displayName,
            }),
        });
    });

    // GET /session/validate — token in header. Accept our mock token.
    await page.route('**/session/validate', async (route) => {
        const headers = route.request().headers();
        const token = headers['x-session-token'];
        if (token === MOCK_SESSION_TOKEN) {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    token: MOCK_SESSION_TOKEN,
                    displayName: 'TestUser',
                }),
            });
        } else {
            await route.fulfill({status: 404});
        }
    });

    // GET /quizApi/decks — list of decks (ownerId query param is ignored).
    await page.route('**/quizApi/decks?**', async (route) => {
        if (route.request().method() !== 'GET') {
            return route.fallback();
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_DECKS),
        });
    });

    // GET /quizApi/decks/{deckId} — single deck content.
    // Match /quizApi/decks/<something> but NOT the bare /quizApi/decks list.
    await page.route(/\/quizApi\/decks\/[^/?]+(\?|$)/, async (route) => {
        const url = new URL(route.request().url());
        const deckId = url.pathname.split('/').pop()!;
        const content = MOCK_DECK_CONTENT[deckId];
        if (!content) {
            await route.fulfill({status: 404});
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(content),
        });
    });

    // GET /quizApi/decks/{deckId}/state — per-card progress (empty for a fresh test).
    await page.route(/\/quizApi\/decks\/[^/?]+\/state(\?|$)/, async (route) => {
        if (route.request().method() !== 'GET') return route.fallback();
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
        });
    });

    // POST /quizApi/decks/{deckId}/state — accept progress updates silently.
    await page.route(/\/quizApi\/decks\/[^/?]+\/state(\?|$)/, async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        await route.fulfill({status: 200, body: ''});
    });

    // GET /japaneseDict/search — dictionary lookup.
    await page.route('**/japaneseDict/search?**', async (route) => {
        const url = new URL(route.request().url());
        const term = url.searchParams.get('q') ?? '';
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_DICT_RESULTS[term] ?? []),
        });
    });

    await page.route('**/kanjiDict/search?**', async (route) => {
        const url = new URL(route.request().url());
        const term = url.searchParams.get('k') ?? '';
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(MOCK_KANJI_RESULTS[term] ?? []),
        });
    });

    // GET http://localhost/kanjivg/<codepoint> — stroke-order SVG for the
    // StrokeOrderKanji component. It's fetched on port 80 (not :4200), so it's
    // unreachable in tests and trips the global "Cannot reach server" snackbar.
    // A stub SVG returns 200 so the error path never fires; the component just
    // finds zero strokes, which is fine since no test asserts on stroke order.
    await page.route('**/kanjivg/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
        });
    });
}