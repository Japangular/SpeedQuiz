import {Inject, Injectable} from '@angular/core';
import {BackendService} from '../backend/backend.service';
import {catchError, Observable, ReplaySubject} from 'rxjs';
import {Card} from '../dualInputCard/quiz.model';
import {INJECTED_QUIZ_BACKEND_API, QuizBackendApi} from '../../interfaces/QuizApi';

@Injectable({
  providedIn: 'root'
})
export class QuizBoardService {
  private cardSubject: ReplaySubject<Card> = new ReplaySubject<Card>(1);
  card$: Observable<Card> = this.cardSubject.asObservable();

  constructor(private backend: BackendService) {
    this.getCard();
  }

  getCard() {
    this.backend.getCard().pipe(
      catchError(error => {
        // Handle error appropriately
        console.error('Error fetching card', error);
        return [];  // You can return a fallback value or rethrow the error
      })
    ).subscribe(card => this.cardSubject.next(card));
  }

  nextCard() {
    this.backend.nextCard().pipe(
      catchError(error => {
        // Handle error appropriately
        console.error('Error fetching next card', error);
        return [];  // You can return a fallback value or rethrow the error
      })
    ).subscribe(() => this.getCard());
  }

  useHint() {
    this.backend.useHint().pipe(
      catchError(error => {
        // Handle error appropriately
        console.error('Error using hint', error);
        return [];  // You can return a fallback value or rethrow the error
      })
    ).subscribe(() => this.nextCard());
  }

  setAsStartPoint() {
    this.backend.setAsStartPoint().pipe(
      catchError(error => {
        // Handle error appropriately
        console.error('Error using startPoint', error);
        return [];  // You can return a fallback value or rethrow the error
      })
    ).subscribe(() => this.nextCard());
  }

  toggleCardType(cardType?: string) {
    this.backend.toggleCardType(cardType).pipe(
      catchError(error => {
        // Handle error appropriately
        console.error('Error using hint', error);
        return [];  // You can return a fallback value or rethrow the error
      })
    ).subscribe(() => this.nextCard());
  }

  jumpTo(jumpKey: string){
    this.backend.jumpTo(jumpKey).pipe(
      catchError(error => {
        // Handle error appropriately
        console.error('Error using hint', error);
        return [];  // You can return a fallback value or rethrow the error
      })
    ).subscribe(() => this.nextCard());
  }
}
