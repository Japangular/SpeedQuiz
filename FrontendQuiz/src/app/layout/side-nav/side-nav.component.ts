import {Component, inject, TemplateRef, ViewChild} from '@angular/core';
import {AsyncPipe, NgForOf, NgIf, NgTemplateOutlet} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatAnchor, MatFabButton, MatIconButton} from '@angular/material/button';
import {MatListItem, MatNavList} from '@angular/material/list';
import {MatSidenav, MatSidenavContainer, MatSidenavContent} from '@angular/material/sidenav';
import {MatToolbar} from '@angular/material/toolbar';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {map, shareReplay} from 'rxjs/operators';
import {ActivatedRoute, Route, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatBottomSheet, MatBottomSheetModule} from '@angular/material/bottom-sheet';
import {Observable} from 'rxjs';
import {LocalProfileService} from '../../user-store-management/local-profile.service';
import {ProvisionComponent} from '../../user-store-management/provision/provision.component';
import {ProfileActionsComponent} from '../../user-store-management/profile-actions/profile-actions.component';
import {SiteModeService} from '../../site-mode/site-mode.service';
import {AccessGateComponent} from '../../site-mode/access-gate/access-gate.component';
import {ContextPanelService, ContextPanelState} from './panel.service';
import {ContextSheet} from './context-sheet.component';

@Component({
  selector: 'app-side-nav',
  imports: [
    AsyncPipe,
    MatIcon,
    MatIconButton,
    MatFabButton,
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
    NgIf,
    NgTemplateOutlet,
    MatProgressBarModule,
    MatTooltipModule,
    MatBottomSheetModule,
    ProvisionComponent,
    ProfileActionsComponent,
    AccessGateComponent,
  ],
  templateUrl: './side-nav.component.html',
  standalone: true,
  styleUrl: './side-nav.component.scss'
})
export class SideNavComponent {
  navItems: Route[] = [];

  private breakpointObserver = inject(BreakpointObserver);
  private route = inject(ActivatedRoute);
  private bottomSheet = inject(MatBottomSheet);
  private contextPanelService = inject(ContextPanelService);

  profileService = inject(LocalProfileService);
  siteModeService = inject(SiteModeService);

  isHandset$ = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  /** The current context panel state (template + icon + label). */
  contextPanel$: Observable<ContextPanelState> = this.contextPanelService.state$;

  constructor() {
    this.navItems =
      this.route.routeConfig?.children?.filter(r => r.data?.['label']) ?? [];
  }

  /**
   * Mobile: open the feature's panel content in a bottom sheet.
   * The sheet component receives the TemplateRef and renders it.
   */
  openContextSheet(): void {
    const state = this.contextPanelService['_state$'].value;
    if (!state.template) return;

    this.bottomSheet.open(ContextSheet, {
      data: {template: state.template, label: state.label},
      panelClass: 'context-bottom-sheet',
    });
  }
}
