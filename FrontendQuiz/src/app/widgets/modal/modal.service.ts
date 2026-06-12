import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {CombinedReadings, KanjiModalComponent} from './kanji-modal/kanji-modal.component';
import {HintModalComponent} from './hint-modal/hint-modal.component';
import {DeckCompletedModalComponent} from './deck-completed/deck-completed-modal.component';
import {Card} from '../../features/quiz/model/quiz.model';

@Injectable({providedIn: 'root'})
export class ModalService {
  /** The one hint dialog allowed to exist. */
  private hintRef: MatDialogRef<HintModalComponent> | null = null;

  constructor(private dialog: MatDialog) {
  }

  openKanjiModal(data: CombinedReadings) {
    this.dialog.open(KanjiModalComponent, {data});
  }

  openHintModal(card: Card, autoCloseMs = 0): Observable<string | undefined> {
    this.hintRef?.close();

    const ref = this.dialog.open(HintModalComponent, {data: {card}});
    this.hintRef = ref;

    if (autoCloseMs > 0) {
      const timer = setTimeout(() => ref.close(), autoCloseMs);
      ref.afterClosed().subscribe(() => clearTimeout(timer));
    }

    ref.afterClosed().subscribe(() => {
      // Only clear if a newer hint hasn't replaced us in the meantime.
      if (this.hintRef === ref) this.hintRef = null;
    });

    return ref.afterClosed();
  }

  hasOpenHint(): boolean {
    return this.hintRef !== null;
  }

  closeHint(): void {
    this.hintRef?.close();
  }

  openEditCardModal(card: Card) {
    this.dialog.open(HintModalComponent, {data: {card}});
  }

  openDeckCompletedModal(cards: Card[]): Observable<'restart' | 'goToAnki' | undefined> {
    return this.dialog.open(DeckCompletedModalComponent, {data: {cards}}).afterClosed();
  }
}
