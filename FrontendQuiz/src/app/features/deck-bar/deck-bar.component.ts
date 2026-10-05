import {Component, EventEmitter, Input, Output, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatDivider} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatTooltip} from '@angular/material/tooltip';
import {QuizEngine} from '../quiz/quiz-board/quiz-engine.service';
import {DeckStore} from '../../store/deck.store';
import {QuizSettingsService} from '../quiz/quiz-settings.service';
import {
  CARD_ORDER_MODES, cardOrderIcon, cardOrderLabel, CardOrderMode,
  REWIND_RULES, rewindIcon, rewindLabel, RewindRule,
} from '../quiz/utils/quiz-session';
import {DeckTimerService, formatDuration} from '../quiz/deck-timer.service';
@Component({
  selector: 'app-deck-bar',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatChipsModule,
    MatCard,
    MatIconButton,
    MatCardContent,
    MatTooltip,
    MatSlideToggle,
    MatSlider,
    MatSliderThumb,
    FormsModule,
    MatMenuTrigger,
    MatMenu,
    MatDivider,
    MatMenuItem
  ],
  templateUrl: './deck-bar.component.html',
  styleUrl: './deck-bar.component.css'
})
export class DeckBarComponent {
  private deckStore = inject(DeckStore);
  protected quizEngine = inject(QuizEngine);   // was private — template needs it
  protected settings = inject(QuizSettingsService);
  protected timer = inject(DeckTimerService);

  readonly rewindRules = REWIND_RULES;
  readonly cardOrders = CARD_ORDER_MODES;

  // ── card order ────────────────────────────────────────────────────────────

  get currentOrder(): CardOrderMode { return this.settings.cardOrder(); }

  orderLabel(mode: CardOrderMode): string { return cardOrderLabel(mode); }
  orderIcon(mode: CardOrderMode): string  { return cardOrderIcon(mode); }

  /** Through the engine, not the setting: the deck has to be re-laid, not just the preference stored. */
  selectOrder(mode: CardOrderMode): void { this.quizEngine.setCardOrder(mode); }
  reshuffle(): void { this.quizEngine.reshuffle(); }

  // ── run clock ─────────────────────────────────────────────────────────────

  get elapsedLabel(): string { return formatDuration(this.timer.displayMs()); }

  get bestLabel(): string | null {
    const best = this.timer.best();
    return best ? formatDuration(best.ms, true) : null;
  }

  get timerTooltip(): string {
    if (this.timer.finished()) return 'Run finished';
    if (this.timer.paused()) {
      return this.timer.displayMs() === 0
        ? 'Starts on your first keystroke'
        : 'Paused — continues when you type';
    }
    return 'Active time on this run';
  }

  get currentRule(): RewindRule    { return this.settings.rewindRule(); }
  get hasSavePoint(): boolean      { return this.quizEngine.hasSavePoint; }
  get levelRewindAvailable(): boolean { return this.quizEngine.deck.hasLevels; }

  ruleLabel(rule: RewindRule): string {
    return rewindLabel(rule, this.hasSavePoint);
  }

  ruleIcon(rule: RewindRule): string {
    return rewindIcon(rule, this.hasSavePoint);
  }

  selectRule(rule: RewindRule): void { this.settings.rewindRule.set(rule); }
  setSavePoint(): void   { this.quizEngine.saveHere(); }
  clearSavePoint(): void { this.quizEngine.clearSave(); }

  deckName = this.deckStore.deckName;
  hasCards = this.deckStore.hasCards;

  showDebounceSlider = false;

  @Input() canReorder = false;
  @Input() reorderActive = false;

  @Input() popoutSupported = false;
  @Input() popoutActive = false;
  @Output() popoutToggle = new EventEmitter<void>();

  @Output() reorderToggle = new EventEmitter<void>();

  @Input() showStrokeOrder = true;
  @Output() showStrokeOrderChange = new EventEmitter<boolean>();

  @Output() hintRequested = new EventEmitter<void>();
  @Output() hintHovered = new EventEmitter<void>();

  resetDeck(): void {
    this.quizEngine.resetSession();
  }

  get debounceLabel(): string {
    const ms = this.settings.hiraganaDebounceMs();
    return `${ms} ms`;
}

  onDebounceChange(value: number): void {
    this.settings.hiraganaDebounceMs.set(value);
  }

  get clearLabel(): string {
    const ms = this.settings.wrongAnswerClearMs();
    return ms <= 0 ? 'Off' : `${(ms / 1000).toFixed(2).replace(/0$/, '')} s`;
  }

  onClearDelayChange(value: number): void {
    this.settings.wrongAnswerClearMs.set(value);
  }
}

