import { Injectable } from '@angular/core';
import {
  HttpInterceptor, HttpRequest, HttpHandler,
  HttpEvent, HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let message = 'Something went wrong';

        if (error.status === 0) {
          message = 'Cannot reach server. Check your connection.';
        } else if (error.status === 404) {
          message = 'Resource not found';
        } else if (error.status === 409) {
          message = 'Duplicate entry';
        } else if (error.status >= 500) {
          message = 'Server error — please try again later';
        } else if (error.error?.message) {
          message = error.error.message;
        }

        this.snackBar.open(message, 'Dismiss', {
          duration: 5000,
          panelClass: 'error-snackbar'
        });

        return throwError(() => error);
      })
    );
  }
}
