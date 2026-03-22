import {Injectable, TemplateRef} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

export interface ContextPanelState {
  template: TemplateRef<any> | null;
  icon: string;
  label: string;
}

const EMPTY: ContextPanelState = {template: null, icon: '', label: ''};

@Injectable({providedIn: 'root'})
export class ContextPanelService {
  private _state$ = new BehaviorSubject<ContextPanelState>(EMPTY);
  state$ = this._state$.asObservable();

  set(template: TemplateRef<any>, icon: string, label: string): void {
    this._state$.next({template, icon, label});
  }

  clear(): void {
    this._state$.next(EMPTY);
  }

  get hasPanel(): boolean {
    return this._state$.value.template !== null;
  }
}
