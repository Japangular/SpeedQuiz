import {AfterViewInit, Component, HostListener, OnDestroy, TemplateRef, ViewChild} from '@angular/core';
import {CardViewComponent} from '../card-view/card-view.component';
import {FormsModule} from '@angular/forms';
import {QuizActionBarComponent} from '../quiz-action-bar/quiz-action-bar.component';
import {ModalService} from '../../../widgets/modal/modal.service';
import {DeckBarComponent} from '../../deck-bar/deck-bar.component';
import {QuizHistorySidebarComponent} from '../../quiz-history-sidebar/quiz-history-sidebar.component';
import {ContextPanelService} from '../../../layout/side-nav/panel.service';

@Component({
  selector: 'app-quiz-board',
  standalone: true,
  imports: [
    CardViewComponent,
    FormsModule,
    QuizActionBarComponent,
    DeckBarComponent,
    QuizHistorySidebarComponent,
  ],
  templateUrl: './quiz-board.component.html',
  styleUrl: './quiz-board.component.css'
})
export class QuizBoardComponent implements AfterViewInit, OnDestroy {
  @ViewChild('historyPanel') historyPanel!: TemplateRef<any>;

  constructor(
    private modal: ModalService,
    private contextPanel: ContextPanelService,
  ) {
  }

  ngAfterViewInit(): void {
    // Deferred to next microtask — setting this synchronously in ngAfterViewInit
    // would change SideNavComponent's [opened] binding in the same CD cycle (NG0100).
    Promise.resolve().then(() => {
      this.contextPanel.set(this.historyPanel, 'history', 'Recent cards');
    });
  }

  ngOnDestroy(): void {
    // Clear panel when navigating away from quiz
    this.contextPanel.clear();
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    // Strg + D → deck modal
    if (event.ctrlKey && event.code === 'KeyD') {
      event.preventDefault();
      this.modal.openDeckModal();
    }
  }
}
