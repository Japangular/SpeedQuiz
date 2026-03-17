import {Injectable, TemplateRef} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

export interface ContextPanelState {
  template: TemplateRef<any> | null;
  icon: string;     // mat-icon name for the mobile FAB trigger
  label: string;    // tooltip / sheet title
}

const EMPTY: ContextPanelState = {template: null, icon: '', label: ''};

@Injectable({providedIn: 'root'})
export class ContextPanelService {
  private _state$ = new BehaviorSubject<ContextPanelState>(EMPTY);
  state$ = this._state$.asObservable();

  /** Feature registers its panel template. */
  set(template: TemplateRef<any>, icon: string, label: string): void {
    this._state$.next({template, icon, label});
  }

  /** Feature clears its panel (typically in ngOnDestroy). */
  clear(): void {
    this._state$.next(EMPTY);
  }

  /** Whether a panel is currently registered. */
  get hasPanel(): boolean {
    return this._state$.value.template !== null;
  }
}
