import {Injectable, effect, inject, signal} from '@angular/core';
import {QuizSettingsService} from '../quiz-settings.service';
import {Subject} from 'rxjs';

/**
 * Pops a live DOM element out into an always-on-top mini window using the
 * Document Picture-in-Picture API (Chromium 116+).
 *
 * Zoom model:
 *  - `contentBaseWidth` = the window width at which zoom is exactly 1.
 *  - Drag-resizing the window derives zoom from it
 *      (zoom = innerWidth / contentBaseWidth -> bigger window, bigger quiz).
 *  - Mousewheel zoom changes the zoom directly, then recomputes
 *    contentBaseWidth so later resizes continue from there.
 *  - The value lives in QuizSettingsService.popoutZoom (persisted), and an
 *    effect() pushes it into the open window — so a settings-page slider
 *    bound to the same signal re-zooms a live popout.
 *
 * CSS `zoom` (not transform: scale) is used because it actually reflows
 * the layout at the new scale. Chromium-only, like the API itself.
 *
 * The element is MOVED, not copied: Angular bindings, (input) handlers,
 * signals — everything keeps working, because they're attached to the
 * nodes themselves and we're just reparenting the nodes into another
 * window's document. On close, the element is moved back where it was.
 *
 * Caveats:
 *  - Chromium only. `isSupported` is false elsewhere; hide the button.
 *  - Must be called from a user gesture (click handler) or the browser
 *    rejects the request.
 *  - Closes automatically when the originating tab closes or navigates.
 *  - Material overlay-based widgets (tooltips, selects, menus) render
 *    into the MAIN window's overlay container — keep the popped-out
 *    content to plain inputs/buttons.
 */

// The API isn't in TypeScript's DOM lib yet.
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow(options?: {width?: number; height?: number}): Promise<Window>;
      window: Window | null;
    };
  }
}

const BASE_WIDTH = 520;
const BASE_HEIGHT = 240;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;

@Injectable({providedIn: 'root'})
export class QuizPopoutService {
  /** Bind UI state to this: e.g. swap the button icon, hide the in-page quiz chrome. */
  readonly active = signal(false);

  readonly isSupported = 'documentPictureInPicture' in window;

  private settings = inject(QuizSettingsService);

  private pipWindow: Window | null = null;
  private placeholder: Comment | null = null;
  private poppedElement: HTMLElement | null = null;
  private contentBaseWidth = BASE_WIDTH;

  readonly keydown = new Subject<KeyboardEvent>();   // import {Subject} from 'rxjs'

  constructor() {
    // Live-apply zoom to the open window, wherever the change came from
    // (wheel, drag-resize, or a settings-page slider).
    effect(() => {
      const z = this.settings.popoutZoom();
      const body = this.pipWindow?.document.body;
      if (body) {
        (body.style as CSSStyleDeclaration & {zoom: string}).zoom = String(z);
      }
    });
  }

  async popOut(element: HTMLElement): Promise<void> {
    if (!this.isSupported || this.active()) return;

    // Open at a size matching the remembered zoom, so the quiz reappears
    // as big as the user last had it.
    const zoom = this.clamp(this.settings.popoutZoom());
    const pip = await window.documentPictureInPicture!.requestWindow({
      width: Math.round(BASE_WIDTH * zoom),
      height: Math.round(BASE_HEIGHT * zoom),
    });
    this.pipWindow = pip;

    for (const node of Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))) {
      pip.document.head.appendChild(node.cloneNode(true));
    }
    pip.document.body.style.margin = '0';
    pip.document.body.style.overflow = 'hidden';

    this.placeholder = document.createComment('quiz-popout-placeholder');
    element.parentNode!.insertBefore(this.placeholder, element);
    pip.document.body.appendChild(element);
    this.poppedElement = element;

    // Calibrate against the size the browser ACTUALLY gave us (it may
    // clamp the request), so innerWidth / contentBaseWidth === zoom now.
    this.contentBaseWidth = pip.innerWidth / zoom;
    (pip.document.body.style as CSSStyleDeclaration & {zoom: string}).zoom = String(zoom);
    this.setZoom(zoom);

    // Drag-resize -> scale content proportionally.
    pip.addEventListener('resize', () => {
      this.setZoom(pip.innerWidth / this.contentBaseWidth);
    });

    // Mousewheel -> zoom (nothing scrolls in here anyway).
    pip.document.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      const z = this.clamp(this.settings.popoutZoom() * factor);
      // Re-anchor so subsequent drag-resizes continue from this zoom.
      this.contentBaseWidth = pip.innerWidth / z;
      this.setZoom(z);
    }, {passive: false});

    this.active.set(true);
    pip.focus();
    element.querySelector<HTMLInputElement>('input')?.focus();

    pip.addEventListener('pagehide', () => this.restore(), {once: true});
    pip.document.addEventListener('keydown', e => this.keydown.next(e));
  }

  close(): void {
    this.pipWindow?.close();
  }

  private setZoom(z: number): void {
    this.settings.popoutZoom.set(this.clamp(z));
    // The effect in the constructor applies it to the body.
  }

  private clamp(z: number): number {
    if (!Number.isFinite(z)) return 1;
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
  }

  private restore(): void {
    if (this.poppedElement && this.placeholder?.parentNode) {
      this.placeholder.parentNode.insertBefore(this.poppedElement, this.placeholder);
      this.placeholder.remove();
    }
    this.placeholder = null;
    this.poppedElement = null;
    this.pipWindow = null;
    this.active.set(false);
  }
}
