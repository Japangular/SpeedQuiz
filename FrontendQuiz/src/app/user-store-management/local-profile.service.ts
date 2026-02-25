import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, catchError, from, Observable, of} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';
import {environment} from '../environments/environment';

export interface LocalProfile {
  token: string;
  displayName: string;
  wkTokenHash?: string;
  wkProvider?: string;
  wkClaimedName?: string;
  exportedAt?: string;
}

export interface SignedProfile {
  profile: LocalProfile;
  signature: string;  // HMAC-SHA256 hex digest
}

interface ProvisionResponse {
  token: string;
  displayName: string;
}

const PROFILE_STORAGE_KEY = 'japangular_profile';

@Injectable({
  providedIn: 'root'
})
export class LocalProfileService {
  private apiUrl = `${environment.apiBaseUrl}/session`;
  private profileSubject = new BehaviorSubject<LocalProfile | null>(null);
  profile$ = this.profileSubject.asObservable();

  private initializedSubject = new BehaviorSubject<boolean>(false);
  initialized$ = this.initializedSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ══════════════════════════════════════════
  //  Bootstrap
  // ══════════════════════════════════════════

  initialize(): Observable<boolean> {
    const stored = this.loadFromStorage();

    if (stored?.token){
      // Trust localStorage immediately → UI renders the sidenav right away.
      // No blank screen, no flicker.
            this.profileSubject.next(stored);
          this.initializedSubject.next(true);

      // Validate in the background — if the token is dead, kick back to provision.
      return this.validate(stored.token).pipe(
        tap(valid => {
          if (!valid) {
            console.warn('Stored token is no longer valid, clearing profile');
            this.clearProfile();
          }
        })
      );
    }

    // No stored token → mark initialized, show provision
    this.initializedSubject.next(true);
    return of(false);
  }

  // ══════════════════════════════════════════
  //  Provisioning
  // ══════════════════════════════════════════

  provision(displayName: string): Observable<LocalProfile | null> {
    return this.http.post<ProvisionResponse>(`${this.apiUrl}/provision`, {displayName}).pipe(
      map(response => {
        const profile: LocalProfile = {
          token: response.token,
          displayName: response.displayName
        };
        this.saveToStorage(profile);
        this.profileSubject.next(profile);
        return profile;
      }),
      catchError(error => {
        console.error('Error while initializing provision', error);
        return of(null);
      })
    )
  }

  // ══════════════════════════════════════════
  //  Token access
  // ══════════════════════════════════════════

  getToken(): string | null {
    return this.profileSubject.value?.token ?? null;
  }

  getDisplayName(): string | null  {
    return this.profileSubject.value?.displayName ?? null;
  }

  isProvisioned(): boolean {
    return this.profileSubject.value?.token != null;
  }

  updateProfile(patch: Partial<LocalProfile>): void{
    const current = this.profileSubject.value;
    if(!current) return;

    const updated = {...current, ...patch};
    this.saveToStorage(updated);
    this.profileSubject.next(updated);
  }

  // ══════════════════════════════════════════
  //  Signed export / import
  // ══════════════════════════════════════════

  exportProfile(): Observable<string> {
    const profile = this.profileSubject.value;
    if (!profile) return of('{}');

    const exportedProfile: LocalProfile = {
      ...profile,
      exportedAt: new Date().toISOString()
    };

    return from(this.sign(exportedProfile, profile.token)).pipe(
      map(signature => {
        const signed: SignedProfile = {profile: exportedProfile, signature};
        return JSON.stringify(signed, null, 2);
      })
    );
  }

  importProfile(json: string): Observable<boolean>{
    try {
      const parsed = JSON.parse(json);

      let profile: LocalProfile;
      let signature: string | null = null;

      if (parsed.profile && parsed.signature) {
        profile = parsed.profile as LocalProfile;
        signature = parsed.signature;
      } else if (parsed.token) {
        profile = parsed as LocalProfile;
      } else {
        return of(false);
      }

      if (!profile.token) return of(false);

      if (signature) {
        return from(this.verify(profile, profile.token, signature)).pipe(
          switchMap(valid => {
            if (!valid) {
              console.warn('Save file signature verification failed — file may have been tampered with');
              return of(false);
          }
            return this.validateAndAccept(profile);
          })
        );
      }

      return this.validateAndAccept(profile);
    } catch {
      return of(false);
    }
  }

  clearProfile(): void {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    this.profileSubject.next(null);
  }

  // ══════════════════════════════════════════
  //  HMAC helpers
  // ══════════════════════════════════════════

  private async sign(profile: LocalProfile, secret: string): Promise<string> {
    const key = await this.deriveKey(secret);
    const data = new TextEncoder().encode(JSON.stringify(profile));
    const sig = await crypto.subtle.sign('HMAC', key, data);
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async verify(profile: LocalProfile, secret: string, expectedSignature: string): Promise<boolean> {
    const actualSignature = await this.sign(profile, secret);
    return actualSignature === expectedSignature;
  }

  private async deriveKey(secret: string): Promise<CryptoKey> {
    const keyData = new TextEncoder().encode(secret);
    return crypto.subtle.importKey(
      'raw',
      keyData,
      {name: 'HMAC', hash: 'SHA-256'},
      false,
      ['sign']
    );
  }

  // ══════════════════════════════════════════
  //  Private helpers
  // ══════════════════════════════════════════

  private validateAndAccept(profile: LocalProfile): Observable<boolean> {
    return this.validate(profile.token).pipe(
      tap(valid => {
        if (valid) {
          this.saveToStorage(profile);
          this.profileSubject.next(profile);
        }
      })
    );
  }

  private validate(token: string): Observable<boolean> {
    return this.http
      .get<ProvisionResponse>(`${this.apiUrl}/validate`, {
        headers: {'X-Session-Token': token}
      })
      .pipe(
        map(() => true),
        catchError(() => of(false))
      );
  }

  private saveToStorage(profile: LocalProfile): void {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  }

  private loadFromStorage(): LocalProfile | null {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LocalProfile;
    } catch {
      return null;
    }
  }
}
