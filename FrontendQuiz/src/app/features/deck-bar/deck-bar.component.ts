import {Component, EventEmitter, Input, Output, inject} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatChipsModule} from '@angular/material/chips';
import {MatCard, MatCardContent, MatCardTitle} from '@angular/material/card';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {QuizEngine} from '../quiz/quiz-board/quiz-engine.service';
import {DeckStore} from '../../store/deck.store';
import {QuizSettingsService} from '../quiz/quiz-settings.service';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';

import {FormsModule} from '@angular/forms';
import {REWIND_RULES, rewindIcon, rewindLabel, RewindRule} from '../quiz/utils/quiz-session';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatDivider} from '@angular/material/list';

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

  readonly rewindRules = REWIND_RULES;

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
}
