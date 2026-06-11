import {Injectable, signal} from '@angular/core';

/**
 * Pops a live DOM element out into an always-on-top mini window using the
 * Document Picture-in-Picture API (Chromium 116+).
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

@Injectable({providedIn: 'root'})
export class QuizPopoutService {
  /** Bind UI state to this: e.g. swap the button icon, hide the in-page quiz chrome. */
  readonly active = signal(false);

  readonly isSupported = 'documentPictureInPicture' in window;

  private pipWindow: Window | null = null;
  private placeholder: Comment | null = null;
  private poppedElement: HTMLElement | null = null;

  /** Pop `element` out. Call from a click handler. */
  async popOut(element: HTMLElement, width = 520, height = 240): Promise<void> {
    if (!this.isSupported || this.active()) return;

    const pip = await window.documentPictureInPicture!.requestWindow({width, height});
    this.pipWindow = pip;

    // 1. Styles do NOT follow nodes across documents — copy every
    //    stylesheet. Angular's component styles are <style> tags in
    //    <head>, so cloning style/link nodes covers them all.
    for (const node of Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))) {
      pip.document.head.appendChild(node.cloneNode(true));
    }
    pip.document.body.style.margin = '0';
    pip.document.body.style.overflow = 'hidden';

    // 2. Leave a marker so we can put the element back EXACTLY where it was.
    this.placeholder = document.createComment('quiz-popout-placeholder');
    element.parentNode!.insertBefore(this.placeholder, element);

    // 3. Move the live element. This is the whole trick.
    pip.document.body.appendChild(element);
    this.poppedElement = element;
    this.active.set(true);

    // 4. Make typing work immediately.
    pip.focus();
    element.querySelector<HTMLInputElement>('input')?.focus();

    // 5. When the mini window closes (user, tab close, navigation) — restore.
    pip.addEventListener('pagehide', () => this.restore(), {once: true});
  }

  /** Close the mini window programmatically (also triggers restore via pagehide). */
  close(): void {
    this.pipWindow?.close();
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
