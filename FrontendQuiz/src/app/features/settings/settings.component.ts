import {Component, DestroyRef, computed, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AsyncPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Subject, debounceTime, interval} from 'rxjs';

import {MatButtonModule} from '@angular/material/button';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatSelectModule} from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {MatSliderModule} from '@angular/material/slider';
import {MatSnackBar} from '@angular/material/snack-bar';

import {DeckInfo} from '../../models/deck.model';
import {DeckShelfService} from '../deck-shelf/deck-shelf.service';
import {
  DeckTransferService,
  ImportInspection,
  ImportMode,
} from '../deck-shelf/deck-transfer.service';
import {DeviceLinkService, LinkCode} from '../../user-store-management/device-link.service';
import {LocalProfileService} from '../../user-store-management/local-profile.service';
import {QuizSettingsService} from '../quiz/quiz-settings.service';
import {REWIND_RULES, RewindRule, rewindLabel} from '../quiz/utils/quiz-session';
import {OfflinePrefetchService} from '../deck-shelf/offline-prefetch.service';
import {OfflineModeService} from '../../services/offline-mode.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSliderModule,
    DatePipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {
  protected settings = inject(QuizSettingsService);
  protected profileService = inject(LocalProfileService);

  private deviceLink = inject(DeviceLinkService);
  private deckShelf = inject(DeckShelfService);
  private deckTransfer = inject(DeckTransferService);
  private snackBar = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  protected prefetching = signal(false);
  protected prefetchProgress = signal<{done: number; total: number} | null>(null);


  constructor() {
    // One ticker for the whole page rather than a timer per code.
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const code = this.linkCode();
        if (!code) return;
        this.secondsLeft.set(Math.max(0, Math.round((code.expiresAt - Date.now()) / 1000)));
      });

    // Inspecting hits the network, so it waits for typing to settle rather
    // than firing on every keystroke of a large paste.
    this.pasteChanged
      .pipe(debounceTime(400), takeUntilDestroyed(this.destroyRef))
      .subscribe(text => this.runInspect(text));

    this.reloadDecks();
  }

  // ── device linking ────────────────────────────────────────────────────────

  readonly linkCode = signal<LinkCode | null>(null);
  readonly generating = signal(false);
  readonly secondsLeft = signal(0);
  readonly claimInput = signal('');
  readonly claiming = signal(false);
  readonly claimError = signal('');

  readonly codeExpired = computed(() => this.linkCode() !== null && this.secondsLeft() <= 0);

  readonly countdownLabel = computed(() => {
    const total = this.secondsLeft();
    if (total <= 0) return 'Expired';
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')} left`;
  });

  generateCode(): void {
    this.generating.set(true);
    this.deviceLink.start().subscribe({
      next: code => {
        this.linkCode.set(code);
        this.secondsLeft.set(code.expiresInSeconds);
        this.generating.set(false);
      },
      error: (err: Error) => {
        this.generating.set(false);
        this.snackBar.open(err.message, 'OK', {duration: 5000});
      },
    });
  }

  copyCode(): void {
    const code = this.linkCode();
    if (!code) return;
    navigator.clipboard?.writeText(code.code).then(
      () => this.snackBar.open('Code copied.', 'OK', {duration: 2000}),
      () => this.snackBar.open('Copying is blocked here. Type it instead.', 'OK', {duration: 4000}),
    );
  }

  claimCode(): void {
    const value = this.claimInput().trim();
    if (!value || this.claiming()) return;

    this.claiming.set(true);
    this.claimError.set('');

    this.deviceLink.claim(value).subscribe({
      next: profile => {
        this.claiming.set(false);
        this.claimInput.set('');
        this.snackBar
          .open(`Signed in as ${profile.displayName}. Reload to see the decks.`, 'Reload',
            {duration: 10000})
          .onAction()
          .subscribe(() => window.location.reload());
        this.reloadDecks();
      },
      error: (err: Error) => {
        this.claiming.set(false);
        this.claimError.set(err.message);
      },
    });
  }

  // ── deck transfer: out ────────────────────────────────────────────────────

  readonly decks = signal<DeckInfo[]>([]);
  readonly decksLoading = signal(false);
  readonly selectedDeckId = signal<string>('');
  readonly exporting = signal(false);

  readonly selectedDeck = computed(
    () => this.decks().find(d => d.id === this.selectedDeckId()) ?? null,
  );

  private reloadDecks(): void {
    this.decksLoading.set(true);
    this.deckShelf.getDeckOverview().subscribe({
      next: decks => {
        // Only user decks carry progress worth moving; the JLPT and Anki
        // providers are identical on every deployment already.
        this.decks.set(decks.filter(d => d.attribution === 'user'));
        this.decksLoading.set(false);
      },
      error: () => {
        this.decks.set([]);
        this.decksLoading.set(false);
      },
    });
  }

  copyDeck(): void {
    const deck = this.selectedDeck();
    if (!deck || this.exporting()) return;

    this.exporting.set(true);
    this.deckTransfer.exportToClipboard(deck).subscribe({
      next: chars => {
        this.exporting.set(false);
        this.snackBar.open(
          `Copied ${deck.name} with its progress (${Math.round(chars / 1024)} KB).`,
          'OK', {duration: 4000});
      },
      error: (err: Error) => {
        this.exporting.set(false);
        this.snackBar.open(err.message ?? 'Copying failed.', 'OK', {duration: 5000});
      },
    });
  }

  downloadDeck(): void {
    const deck = this.selectedDeck();
    if (!deck || this.exporting()) return;

    this.exporting.set(true);
    this.deckTransfer.exportToFile(deck).subscribe({
      next: () => this.exporting.set(false),
      error: () => {
        this.exporting.set(false);
        this.snackBar.open('Export failed.', 'OK', {duration: 4000});
      },
    });
  }

  // ── deck transfer: in ─────────────────────────────────────────────────────

  readonly pasteInput = signal('');
  readonly inspection = signal<ImportInspection | null>(null);
  readonly inspecting = signal(false);
  readonly importing = signal(false);
  readonly importError = signal('');
  readonly importMode = signal<ImportMode>('merge');

  private pasteChanged = new Subject<string>();

  onPasteChange(text: string): void {
    this.pasteInput.set(text);
    this.inspection.set(null);
    this.importError.set('');
    this.pasteChanged.next(text);
  }

  private runInspect(text: string): void {
    if (!text.trim()) {
      this.inspecting.set(false);
      return;
    }
    this.inspecting.set(true);

    this.deckTransfer.inspect(text).subscribe({
      next: inspection => {
        this.inspecting.set(false);
        this.inspection.set(inspection);
        // Merge is only meaningful against an existing deck. Without one the
        // mode selector is hidden, so leaving it on 'merge' would be a lie.
        this.importMode.set(inspection.existing ? 'merge' : 'new');
      },
      error: (err: Error) => {
        this.inspecting.set(false);
        this.importError.set(err.message ?? 'That paste could not be read.');
      },
    });
  }

  /** Button label follows the mode, and the snackbar afterwards uses the same verb. */
  readonly applyLabel = computed(() => {
    if (!this.inspection()?.existing) return 'Import';
    switch (this.importMode()) {
      case 'merge':   return 'Merge';
      case 'replace': return 'Replace';
      case 'new':     return 'Save as a copy';
    }
  });

  readonly canApply = computed(
    () => !!this.inspection() && !this.importing() && !this.inspecting(),
  );

  applyImport(): void {
    const inspection = this.inspection();
    if (!inspection || this.importing()) return;

    const mode = this.importMode();
    this.importing.set(true);
    this.importError.set('');

    this.deckTransfer.apply(inspection, mode).subscribe({
      next: result => {
        this.importing.set(false);
        this.pasteInput.set('');
        this.inspection.set(null);
        this.reloadDecks();

        const verb = result.mode === 'merge' ? 'Merged into'
          : result.mode === 'replace' ? 'Replaced'
            : 'Imported';
        const parts = [`${verb} ${result.name} (${result.cardCount} cards)`];
        if (result.renamedFrom) parts.push(`renamed from "${result.renamedFrom}"`);
        if (!result.progressRestored) parts.push('without progress');
        this.snackBar.open(parts.join(', ') + '.', 'OK', {duration: 6000});
      },
      error: (err: Error) => {
        this.importing.set(false);
        this.importError.set(err.message ?? 'Import failed.');
      },
    });
  }

  onImportFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    // Route a picked file through the same preview rather than committing it
    // blind — the whole point of the preview is that it is not skippable.
    file.text().then(
      text => {
        this.pasteInput.set(text);
        this.runInspect(text);
      },
      () => this.importError.set('That file could not be read.'),
    );
  }

  // ── preview wording ───────────────────────────────────────────────────────

  /** "3 days ago", "20 minutes ago", "just now". Undefined when never studied. */
  ago(timestamp?: number): string {
    if (!timestamp) return 'never studied';

    const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
    if (seconds < 90) return 'just now';

    const units: [number, string][] = [
      [60, 'minute'],
      [3600, 'hour'],
      [86400, 'day'],
      [604800, 'week'],
    ];

    let label = 'a long time';
    for (let i = units.length - 1; i >= 0; i--) {
      const [size, name] = units[i];
      if (seconds >= size) {
        const n = Math.round(seconds / size);
        label = `${n} ${name}${n === 1 ? '' : 's'}`;
        break;
      }
    }
    return `${label} ago`;
  }

  // ── quiz defaults ─────────────────────────────────────────────────────────

  readonly rewindRules = REWIND_RULES;

  ruleLabel(rule: RewindRule): string {
    // No deck is attached on this page, so the anchor-dependent wording would
    // be misleading. Always describe the rule in its neutral form.
    return rewindLabel(rule, false);
  }

  get syncSeconds(): number {
    return Math.round(this.settings.sessionSyncDebounceMs() / 1000);
  }

  setSyncSeconds(seconds: number): void {
    this.settings.sessionSyncDebounceMs.set(seconds * 1000);
  }

  // ── profile ───────────────────────────────────────────────────────────────

  downloadProfile(): void {
    this.profileService.exportProfile().subscribe(json => {
      const blob = new Blob([json], {type: 'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `japangular-save-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.snackBar.open(
        'Save file downloaded. Keep it private — it grants access to your data.',
        'OK', {duration: 5000});
    });
  }

  clearSession(): void {
    if (!confirm('Clear this session? Decks stay on the server, but this device forgets who you are.')) {
      return;
    }
    this.profileService.clearProfile();
    this.snackBar
      .open('Session cleared. Reload to start over.', 'Reload', {duration: 10000})
      .onAction()
      .subscribe(() => window.location.reload());
  }

  private prefetch = inject(OfflinePrefetchService);
  protected offlineMode = inject(OfflineModeService);

  private static readonly LAST_PREFETCH_KEY = 'japangular_offline_prefetch_at';

  protected lastPrefetch = signal<string | null>(
    localStorage.getItem(SettingsComponent.LAST_PREFETCH_KEY),
  );

  protected prefetchPercent = computed(() => {
    const p = this.prefetchProgress();
    return p ? Math.round((p.done / p.total) * 100) : 0;
  });

  saveAllOffline(): void {
    this.prefetching.set(true);
    this.prefetchProgress.set(null);

    this.prefetch.prefetchAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: p => this.prefetchProgress.set(p),
        complete: () => {
          this.prefetching.set(false);
          const stamp = new Date().toISOString();
          localStorage.setItem(SettingsComponent.LAST_PREFETCH_KEY, stamp);
          this.lastPrefetch.set(stamp);
          this.snackBar.open(
            `${this.prefetchProgress()?.total ?? 0} decks available offline.`,
            'OK', {duration: 3000});
        },
        error: () => {
          this.prefetching.set(false);
          this.snackBar.open(
            'Could not reach the server. Run this while you still have signal.',
            'OK', {duration: 4000});
        },
      });
  }

}
