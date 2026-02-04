import {Routes} from '@angular/router';
import {DynamicCardCreatorComponent} from './features/dynamic-card-creator/dynamic-card-creator.component';
import {SideNavComponent} from './layout/side-nav/side-nav.component';
import {AboutComponent} from './layout/about/about.component';
import {DeckComponent} from './features/deck-table/deck/deck.component';
import {QuizBoardComponent} from './features/quiz/quiz-board/quiz-board.component';
import {JapaneseDictComponent} from './features/dict/japanese-dict/japanese-dict.component';
import {AnkiTableComponent} from './features/anki-table/anki-table.component';
import {KanjiWallComponent} from './features/kanji-wall/kanji-wall.component';
import {TestComponent} from './features/test/test.component';
import {OverviewComponent} from './features/overview/overview.component';
import {KanjiDetailComponent} from './features/kanji-details/kanji-details.component';
import {TranscriptionTranslationTableComponent} from './features/transcription-translation/transcription-translation-table.component';

export const routes: Routes = [
  {
    path: '',
    component: SideNavComponent,
    children: [
      {
        path: 'table',
        component: DeckComponent,
        data: {label: 'Table', icon: 'table_chart'}
      },
      {
        path: 'cardCreator',
        component: DynamicCardCreatorComponent,
        data: {label: 'Deck Stepper', icon: 'style'}
      },
      {
        path: 'quiz',
        component: QuizBoardComponent,
        data: {label: 'Quiz', icon: 'web'}
      },
      {
        path: 'dict',
        component: JapaneseDictComponent,
        title: 'Dict',
        data: {label: 'Dictionary', icon: 'menu_book'}
      },
      {
        path: 'anki',
        component: AnkiTableComponent,
        title: 'Anki',
        data: {label: 'Anki Table', icon: 'view_list'}
      },
      {
        path: 'kanjiWall',
        component: KanjiWallComponent,
        title: 'Kanji Wall',
        data: {label: 'Kanji Wall', icon: 'grid_view'}
      },
      {
        path: 'overview',
        component: OverviewComponent,
        title: 'Overview',
        data: {label: 'Overview', icon: 'dashboard'}
      },
      {
        path: 'transcriptTable',
        component: TranscriptionTranslationTableComponent,
        data: {label: 'Transcripts', icon: 'translate'}
      },
      {
        path: 'testing',
        component: TestComponent,
        data: {label: 'Testing', icon: 'build'}
      },

      // ❌ not in sidenav (no label)
      {
        path: 'kanjiDetails/:kanji',
        component: KanjiDetailComponent
      },

      // pinned to bottom
      {
        path: 'about',
        component: AboutComponent,
        title: 'About',
        data: {label: 'About', bottom: true, icon: 'info'}
      }
    ]
  },

  // fallback
  {path: '', redirectTo: '/table', pathMatch: 'full'}
];
