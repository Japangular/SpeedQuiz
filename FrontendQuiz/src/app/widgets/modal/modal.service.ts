import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {CombinedReadings, KanjiModalComponent} from './kanji-modal/kanji-modal.component';
import {HintModalComponent} from './hint-modal/hint-modal.component';
import {DeckCompletedModalComponent} from './deck-completed/deck-completed-modal.component';
import {Observable} from 'rxjs';
import {DeckModalComponent} from './deck-modal/deck-modal.component';
import {Card} from '../../features/quiz/model/quiz.model';

@Injectable({providedIn: 'root'})
export class ModalService {
  constructor(private dialog: MatDialog) {
  }

  openKanjiModal(data: CombinedReadings) {
    this.dialog.open(KanjiModalComponent, {data});
  }

  openHintModal(card: Card): Observable<string | undefined> {
    return this.dialog.open(HintModalComponent, {data: { card },}).afterClosed();
  }

  openEditCardModal(card: Card){
    this.dialog.open(HintModalComponent, {data: {card}});
  }

  openDeckCompletedModal(cards: Card[]): Observable<'restart' | 'goToAnki' | undefined> {
    return this.dialog.open(DeckCompletedModalComponent, {data: {cards}}).afterClosed();
  }

  openDeckModal(){
    return this.dialog.open(DeckModalComponent);
  }
}
