import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpRequest } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type UploadStatus =
  | { kind: 'progress'; percent: number }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

@Injectable({ providedIn: 'root' })
export class AnkiImportService {
  private http = inject(HttpClient);

  /** Streams progress events; completes on success, errors on HTTP failure. */
  importAnkiFile(file: File, deckName: string): Observable<UploadStatus> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('deckName', deckName);

    const req = new HttpRequest('POST', `${environment.apiBaseUrl}/anki/import`, form, {
      reportProgress: true,
      // DO NOT set Content-Type manually — the browser sets it with the multipart boundary.
      // If your interceptor doesn't attach X-Session-Token automatically, add it here:
      // headers: new HttpHeaders({ 'X-Session-Token': sessionToken })
    });

    return this.http.request(req).pipe(
      map((event: HttpEvent<unknown>): UploadStatus => {
        switch (event.type) {
          case HttpEventType.UploadProgress: {
            const percent = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
            return { kind: 'progress', percent };
          }
          case HttpEventType.Response:
            return { kind: 'done' };
          default:
            return { kind: 'progress', percent: 0 };
        }
      })
    );
  }
}
