import { test as base, expect } from '@playwright/test';
import { ProvisionPage } from './pages/provision.page';
import { DeckShelfPage } from './pages/deck-shelf.page';
import { SideNavPage } from './pages/side-nav.page';
import { mockBackend } from './mocks/backend';
import {QuizPage} from "./pages/quiz.page";
import {DictPage} from "./pages/dict.page";

type AppFixtures = {
    provisionPage: ProvisionPage;
    deckShelfPage: DeckShelfPage;
    sideNavPage: SideNavPage;
  /** A page where the backend is mocked AND a profile is already provisioned. */
    authenticatedPage: ProvisionPage;
  /** A page where only the backend is mocked, no profile yet. */
  mockedPage: { provision: ProvisionPage };
  quizPage: QuizPage;
  dictPage: DictPage;
};

export const test = base.extend<AppFixtures>({
    provisionPage: async ({ page }, use) => {
        await use(new ProvisionPage(page));
    },
    deckShelfPage: async ({ page }, use) => {
        await use(new DeckShelfPage(page));
    },
    quizPage: async ({ page }, use) => {
        await use(new QuizPage(page));
    },
    dictPage: async ({ page }, use) => {
        await use(new DictPage(page));
    },
    sideNavPage: async ({ page }, use) => {
        await use(new SideNavPage(page));
    },
  mockedPage: async ({ page }, use) => {
    await mockBackend(page);
    await use({ provision: new ProvisionPage(page) });
  },
    authenticatedPage: async ({ page }, use) => {
    await mockBackend(page);
        const provision = new ProvisionPage(page);
        await provision.gotoWithToken('portfolio');
        await provision.createProfile(`TestUser-${Date.now()}`);
        await use(provision);
    },
});

export { expect };