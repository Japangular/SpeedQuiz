import {Component, inject} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from "@angular/common";
import {MatIcon} from "@angular/material/icon";
import {MatAnchor, MatIconButton} from "@angular/material/button";
import {MatListItem, MatNavList} from "@angular/material/list";
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from "@angular/material/sidenav";
import {MatToolbar} from "@angular/material/toolbar";
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {ActivatedRoute, Route, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-side-nav',
  imports: [
    AsyncPipe,
    MatIcon,
    MatIconButton,
    MatListItem,
    MatNavList,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatToolbar,
    RouterOutlet,
    RouterLink,
    MatAnchor,
    RouterLinkActive,
    NgForOf,
    NgIf
  ],
  templateUrl: './side-nav.component.html',
  standalone: true,
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent {
  navItems: Route[] = [];

  private breakpointObserver = inject(BreakpointObserver);
  private route = inject(ActivatedRoute);

  isHandset$ = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor() {
    this.navItems =
      this.route.routeConfig?.children?.filter(r => r.data?.['label']) ?? [];

    console.log(this.navItems);
  }
}
