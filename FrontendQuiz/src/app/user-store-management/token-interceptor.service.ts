import { Injectable } from '@angular/core';
import {LocalProfileService} from './local-profile.service';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenInterceptorService implements HttpInterceptor {

  constructor(private profileService: LocalProfileService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.includes('/kanjivg/')) {
      return next.handle(req);
    }

    const token = this.profileService.getToken();

    if (token) {
      return next.handle(req.clone({setHeaders: {'X-Session-Token': token}}));
    }
    return next.handle(req);
  }
}
