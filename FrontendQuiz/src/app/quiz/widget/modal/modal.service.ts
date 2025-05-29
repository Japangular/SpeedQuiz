import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {CombinedReadings, KanjiModalComponent} from './kanji-modal/kanji-modal.component';
import {HintModalComponent} from './hint-modal/hint-modal.component';

@Injectable({providedIn: 'root'})
export class ModalService {
  constructor(private dialog: MatDialog) {
  }

  openKanjiModal(data: CombinedReadings) {
    this.dialog.open(KanjiModalComponent, {data});
  }

  openHintModal(hintData: any) {
    this.dialog.open(HintModalComponent, {data: hintData});
  }
}
