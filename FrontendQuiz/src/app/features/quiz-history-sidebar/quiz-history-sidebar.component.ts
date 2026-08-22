import {AfterViewChecked, Component, effect, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';

import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {QuizEngine, ResumePoint} from '../quiz/quiz-board/quiz-engine.service';
import {Card} from '../quiz/model/quiz.model';
import {QuizSettingsService} from '../quiz/quiz-settings.service';
import {levelHue} from '../quiz/utils/level-theme';
import {rewindIcon} from '../quiz/utils/quiz-session';

interface HistoryEntry {
  uid: string;
  card: Card;
  expanded: boolean;
  hintUsed: boolean;
  solvedExactly?: boolean;
  timestamp: number;
}

@Component({
  selector: 'app-quiz-history-sidebar',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSlideToggleModule,
    FormsModule
],
  templateUrl: './quiz-history-sidebar.component.html',
  styleUrl: './quiz-history-sidebar.component.css',
})
export class QuizHistorySidebarComponent implements OnInit, OnDestroy, AfterViewChecked {
  history: HistoryEntry[] = [];

  get newestFirst(): boolean { return this.settings.historyNewestFirst(); }
  set newestFirst(v: boolean) {
    this.settings.historyNewestFirst.set(v);
    this.shouldScroll = true;     // re-pin to the correct edge
  }

  private currentIndex = -1;
  private visitedIndices = new Set<number>();
  private cardSub?: Subscription;
  private shouldScroll = false;

  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;

  currentLevel = 0;
  resume!: ResumePoint;

  private settings = inject(QuizSettingsService);
  private saveSub?: Subscription;
  private resetSub?: Subscription;

  constructor(private quizEngine: QuizEngine) {
    this.resume = this.quizEngine.resumePoint;

    // Rule and once-per-level can change from the deck bar's #rewindMenu
    // without any card emission, so the banner follows the signals directly.
    effect(() => {
      this.settings.rewindRule();
      this.refreshResume();
    });
  }

  private historyInitialized = false;

  ngOnInit(): void {
    this.saveSub = this.quizEngine.savePointChanged$.subscribe(() => this.refreshResume());
    this.resetSub = this.quizEngine.reset$.subscribe(() => {
      this.history = [];
      this.visitedIndices.clear();
      this.historyInitialized = false;
    });
    this.cardSub = this.quizEngine.card$.subscribe(card => {
      if (!card) return;

      if (!this.historyInitialized) {
        this.historyInitialized = true;
        const session = this.quizEngine.getSession();
        for (const entry of session.getAllEntries()) {
          if (entry.solvedAt && entry.card.index !== card.index) {
            this.history.push({
              uid: entry.uid,
              card: entry.card,
              expanded: false,
              hintUsed: entry.hintUsed,
              solvedExactly: entry.solvedExactly,
              timestamp: entry.solvedAt,
            });
          }
        }
        this.history.sort((a, b) => a.timestamp - b.timestamp);
        this.history.forEach(e => {
          if (e.card.index <= card.index) {
            this.visitedIndices.add(e.card.index);
          }
        });
      }

      const previousIndex = this.currentIndex;
      this.currentIndex = card.index;

      if (previousIndex >= 0 && card.index < previousIndex) {
        const reset = new Set<number>();
        for (const idx of this.visitedIndices) {
          if (idx <= card.index) {
            reset.add(idx);
          }
        }
        this.visitedIndices = reset;
      }

      this.visitedIndices.add(card.index);

      const session = this.quizEngine.getSession();
      for (const entry of this.history) {
        const sessionEntry = session.getEntryByUid(entry.uid);
        if (sessionEntry) {
          entry.hintUsed = sessionEntry.hintUsed;
          if (sessionEntry.solvedExactly !== undefined) {
            entry.solvedExactly = sessionEntry.solvedExactly;
          }
        }
      }

      for (const entry of this.history) {
        if (!this.visitedIndices.has(entry.card.index)) {
          entry.expanded = false;
        }
      }

      const existingIdx = this.history.findIndex(e => e.card.index === card.index);
      if (existingIdx >= 0) {
        const [existing] = this.history.splice(existingIdx, 1);
        existing.timestamp = Date.now();
        this.history.push(existing);
      } else {
        const entry = this.quizEngine.currentEntry;
        if (entry) {
          this.history.push({
            uid: entry.uid,
            card,
            expanded: false,
            hintUsed: entry.hintUsed,
            solvedExactly: entry.solvedExactly,
            timestamp: Date.now(),
          });
        }
      }

      this.shouldScroll = true;
      this.currentLevel = card.level;
      this.refreshResume();
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
    this.saveSub?.unsubscribe();
    this.resetSub?.unsubscribe();
  }

  private refreshResume(): void {
    this.resume = this.quizEngine.resumePoint;
  }

  get hue(): number         { return levelHue(this.currentLevel); }
  get hasLevels(): boolean  { return this.quizEngine.deck.hasLevels; }
  get resumeIcon(): string  { return rewindIcon(this.resume.rule, this.quizEngine.hasSavePoint); }

  /** Each row carries its own level's hue; the panel carries the current one. */
  hueFor(level: number): number { return levelHue(level); }

  /** The card in the list a hint would send you back to. */
  isResumeTarget(entry: HistoryEntry): boolean {
    return this.resume.willRewind && this.resume.card?.index === entry.card.index;
  }

  get visibleHistory(): HistoryEntry[] {
    const filtered = this.history.filter(e => e.card.index !== this.currentIndex);
    return this.newestFirst ? [...filtered].reverse() : filtered;
  }

  isDisabled(entry: HistoryEntry): boolean {
    return !this.visitedIndices.has(entry.card.index);
  }

  toggle(entry: HistoryEntry): void {
    if (this.isDisabled(entry)) return;
    entry.expanded = !entry.expanded;
  }

  jumpToCard(entry: HistoryEntry): void {
    if (this.isDisabled(entry)) return;
    this.quizEngine.getDeckCommand().jumpTo(c => c.index === entry.card.index);
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
