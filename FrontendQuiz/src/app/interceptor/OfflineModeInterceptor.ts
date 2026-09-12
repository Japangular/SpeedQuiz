import {inject, Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {OfflineModeService} from '../services/offline-mode.service';
import {from, Observable, throwError} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';


@Injectable()
export class OfflineModeInterceptor implements HttpInterceptor {
  private mode = inject(OfflineModeService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.mode.forced()) return next.handle(req);

    if (req.method === 'GET' && 'caches' in window) return this.fromCache(req);

    // Writes are refused locally rather than queued. Every caller already has
    // a local fallback, and a request that never leaves cannot hang the UI.
    return throwError(() => new HttpErrorResponse({
      status: 0, statusText: 'Offline mode', url: req.url,
    }));
  }

  private fromCache(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    return from(caches.match(req.urlWithParams, {ignoreVary: true})).pipe(
      switchMap(hit => {
        if (!hit) {
          return throwError(() => new HttpErrorResponse({
            status: 504, statusText: 'Not cached', url: req.url,
          }));
        }
        return from(hit.json()).pipe(
          map(body => new HttpResponse({body, status: 200, url: req.url})),
        );
      }),
    );
  }
}
