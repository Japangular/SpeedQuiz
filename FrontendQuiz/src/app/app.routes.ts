import { Routes } from '@angular/router';
import {DynamicCardCreatorComponent} from './features/dynamic-card-creator/dynamic-card-creator.component';
import {SideNavComponent} from './layout/side-nav/side-nav.component';
import {AboutComponent} from './layout/about/about.component';
import {DeckComponent} from './features/deck-table/deck/deck.component';
import {QuizBoardComponent} from './features/quiz/quiz-board/quiz-board.component';
import {JapaneseDictComponent} from './features/dict/japanese-dict/japanese-dict.component';
import {AnkiTableComponent} from './features/anki-table/anki-table.component';
import {KanjiWallComponent} from './features/kanji-wall/kanji-wall.component';
import {TestComponent} from './features/test/test.component';

export const routes: Routes = [
  {path: 'table', component: DeckComponent},
  {path: 'cardCreator', component: DynamicCardCreatorComponent},
  {
    path: 'quizCardApp',
    component: SideNavComponent, // Parent layout for the left and right side navigation
    children: [
      // Left side navigation routes
      {path: 'table', component: DeckComponent, outlet: 'leftOutlet'},
      {path: 'cardCreator', component: DynamicCardCreatorComponent, outlet: 'leftOutlet'},
      {path: 'quiz', component: QuizBoardComponent, outlet: 'leftOutlet'},
      {path: 'dict', component: JapaneseDictComponent, outlet: 'leftOutlet', title: 'dict'},
      {path: 'anki', component: AnkiTableComponent, outlet: 'leftOutlet', title: 'anki'},
      {path: 'kanjiWall', component: KanjiWallComponent, outlet: 'leftOutlet', title: 'KanjiWall'},
      {path: 'testing', component: TestComponent, outlet: 'leftOutlet'},
      {path: 'about', component: AboutComponent, outlet: 'leftOutlet', title: 'About'},
    ]
  },
  {
    path: 'about',
    component: AboutComponent,
    title: 'About'
  },
  {path: '', redirectTo: '/quizCardApp', pathMatch: 'full'},
];
