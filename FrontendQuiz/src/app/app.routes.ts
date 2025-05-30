import { Routes } from '@angular/router';
import {DeckComponent} from './features/deck/deck.component';
import {DynamicCardCreatorComponent} from './features/dynamic-card-creator/dynamic-card-creator.component';
import {SideNavComponent} from './layout/side-nav/side-nav.component';
import {QuizBoardComponent} from './quiz/quizBoard/quiz-board.component';
import {AboutComponent} from './layout/about/about.component';

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
    ]
  },
  {
    path: 'about',
    component: AboutComponent,
    title: 'About'
  },
  {path: '', redirectTo: '/quizCardApp', pathMatch: 'full'},
];
