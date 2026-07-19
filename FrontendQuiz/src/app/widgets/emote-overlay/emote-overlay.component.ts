import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {EmoteService} from './emote.service';

/**
 * Floats the current emote over its parent (position: absolute, bottom-right).
 * Drop <app-emote-overlay /> inside any `position: relative` container —
 * in your case the .popout-host div, so it also travels into the PiP popout.
 *
 * The @for with `track emote.key` is deliberate: a new key recreates the
 * <img>, which restarts the CSS animation even when the same emote fires
 * twice in a row.
 */
@Component({
  selector: 'app-emote-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (emote of asList(); track emote.key) {
      <img class="emote"
           [class.flash]="emote.mode === 'flash'"
           [class.linger]="emote.mode === 'linger'"
           [src]="emote.src"
           alt=""
           aria-hidden="true"
           draggable="false" />
    }
  `,
  styleUrl: './emote-overlay.component.css',
})
export class EmoteOverlayComponent {
  private readonly emotes = inject(EmoteService);
  readonly asList = computed(() => {
    const e = this.emotes.current();
    return e ? [e] : [];
  });
}
