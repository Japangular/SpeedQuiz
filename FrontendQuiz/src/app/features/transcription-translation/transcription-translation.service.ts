import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient, HttpErrorResponse, HttpParams} from '@angular/common/http';
import {stream_transcript} from './transcription-translation.model';
import {catchError, Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TranscriptionTranslationService {
  private apiUrl = `${environment.apiBaseUrl}/transcriptCards`;

  constructor(private http: HttpClient) {
  }

  persistStreamTranscripts(st: stream_transcript): Observable<string> {
    return this.http.post<boolean>(`${this.apiUrl}/persistStreamTranscripts`, st).pipe(
      map((success: boolean) => {
        return success ? 'Transcript uploaded successfully.' : 'Upload failed on server.';
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status === 409) {
          return of(typeof err.error === 'string' ? err.error : 'This stream has already been uploaded.');
        } else {
          console.error(err);
          return of('Unexpected error occurred during upload.');
        }
      })
    );
  }

  checkByTitleAndVTuber(title: string, vtuber: string): Observable<boolean> {
    const params = new HttpParams().set('title', title).set('vtuber', vtuber);
    return this.http.get<boolean>(`${this.apiUrl}/checkByTitleAndVTuber`, {params});
  }
}
