import {AfterViewChecked, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {QuizBoardService} from '../quiz/quiz-board/quiz-board.service';
import {Card} from '../quiz/model/quiz.model';

interface HistoryEntry {
  card: Card;
  expanded: boolean;
  hintUsed: boolean;
  timestamp: number;
}

@Component({
  selector: 'app-quiz-history-sidebar',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    FormsModule,
  ],
  templateUrl: './quiz-history-sidebar.component.html',
  styleUrl: './quiz-history-sidebar.component.css',
})
export class QuizHistorySidebarComponent implements OnInit, OnDestroy, AfterViewChecked {
  history: HistoryEntry[] = [];
  newestFirst = false;

  private currentIndex = -1;
  private cardSub?: Subscription;
  private shouldScroll = false;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;

  constructor(private quizBoard: QuizBoardService) {
  }

  private historyInitialized = false;

  ngOnInit(): void {
    this.cardSub = this.quizBoard.card$.subscribe(card => {
      if (!card) return;

      if (!this.historyInitialized) {
        this.historyInitialized = true;
        const session = this.quizBoard.getSession();
        for (const entry of session.getAllEntries()) {
          if (entry.solvedAt && entry.card.index !== card.index) {
            this.history.push({
              card: entry.card,
              expanded: false,
              hintUsed: entry.hintUsed,
              timestamp: entry.solvedAt,
            });
          }
        }
        this.history.sort((a, b) => a.timestamp - b.timestamp);
      }

      this.currentIndex = card.index;

      for (const entry of this.history) {
        if (entry.card.index > this.currentIndex) {
          entry.expanded = false;
        }
      }

      const existingIdx = this.history.findIndex(e => e.card.index === card.index);
      if (existingIdx >= 0) {
        const [existing] = this.history.splice(existingIdx, 1);
        existing.timestamp = Date.now();
        this.history.push(existing);
      } else {
        const session = this.quizBoard.getSession();
        const sessionEntry = session?.getEntry(card.index);

        this.history.push({
          card,
          expanded: false,
          hintUsed: sessionEntry?.hintUsed ?? false,
          timestamp: Date.now(),
        });
      }

      this.shouldScroll = true;
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.shouldScroll = false;
      this.scrollToEdge();
    }
  }

  ngOnDestroy(): void {
    this.cardSub?.unsubscribe();
  }

  get visibleHistory(): HistoryEntry[] {
    const filtered = this.history.filter(e => e.card.index !== this.currentIndex);
    return this.newestFirst ? [...filtered].reverse() : filtered;
  }

  isDisabled(entry: HistoryEntry): boolean {
    return entry.card.index > this.currentIndex;
  }

  toggle(entry: HistoryEntry): void {
    if (this.isDisabled(entry)) return;
    entry.expanded = !entry.expanded;
  }

  jumpToCard(entry: HistoryEntry): void {
    if (this.isDisabled(entry)) return;
    this.quizBoard.getDeckCommand().jumpTo(c => c.index === entry.card.index);
  }

  getAnswers(card: Card): { key: string; value: string }[] {
    return Object.entries(card.answers)
      .filter(([_, value]) => value !== card.question)
      .map(([key, value]) => ({key, value}));
  }

  trackByIndex(_: number, entry: HistoryEntry): number {
    return entry.card.index;
  }

  private scrollToEdge(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;
    if (this.newestFirst) {
      el.scrollTop = 0;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }
}
