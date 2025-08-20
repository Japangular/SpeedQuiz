import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {CombinedReadings, KanjiModalComponent} from './kanji-modal/kanji-modal.component';
import {HintModalComponent} from './hint-modal/hint-modal.component';
import {Card} from '../../answer-slots/quiz.model';
import {EditCardModalComponent} from './edit-card-modal/edit-card-modal.component';

@Injectable({providedIn: 'root'})
export class ModalService {
  constructor(private dialog: MatDialog) {
  }

  openKanjiModal(data: CombinedReadings) {
    this.dialog.open(KanjiModalComponent, {data});
  }

  openHintModal(card: Card) {
    this.dialog.open(HintModalComponent, {data: {card}});
  }

  openEditCardModal(card: Card){
    this.dialog.open(HintModalComponent, {data: {card}});
  }
}
