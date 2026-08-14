import { Component, OnInit, HostListener, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { Router } from '@angular/router';
import { RoleEnum } from '../../generated/enum/role-enum';
import { CustomPageService, CustomPageWithRolesDto, UserService } from '../../generated';

@Component({
  selector: 'header-nav',
  templateUrl: './header-nav.component.html',
  styleUrls: ['./header-nav.component.scss'],
  standalone: false
})

export class HeaderNavComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  private authenticationService = inject(AuthenticationService);

  // Read straight off the service signal so the nav re-renders on login and
  // logout; the old subscribe-and-mirror would leave it stale under zoneless.
  private currentUser = this.authenticationService.currentUser;

  windowWidth: number;

  public learnMorePages = signal<CustomPageWithRolesDto[]>([]);

  @HostListener('window:resize')
  resize() {
    this.windowWidth = window.innerWidth;
  }

  constructor(
    private userService: UserService,
    private alertService: AlertService,
    private customPageService: CustomPageService,
    private router: Router
  ) { }


  ngOnInit() {
    // Still subscribed, but only to trigger the dependent fetches when the user
    // resolves -- the user itself is read from the signal above.
    this.authenticationService.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(currentUser => {
      if (currentUser) {
        if (this.isAdministrator()) {
          this.userService.usersUnassignedReportGet().subscribe(report => {
            if (report.Count > 0) {
              this.alertService.pushAlert(new Alert(`There are ${report.Count} users who are waiting for you to configure their account. <a href='/users'>Manage Users</a>.`, AlertContext.Info, true, AlertService.USERS_AWAITING_CONFIGURATION));
            }
          })
        }
        this.customPageService.customPagesWithRolesGet().subscribe(customPagesWithRoles => {
          customPagesWithRoles = customPagesWithRoles
            .filter(x => x.ViewableRoles.map(role => role.RoleID).includes(this.currentUser()?.Role?.RoleID));
          this.learnMorePages.set(customPagesWithRoles.filter(x => x.MenuItem.MenuItemName == 'LearnMore'));
        });
      }
    });
  }

  public isAuthenticated(): boolean {
    return this.authenticationService.isAuthenticated();
  }

  public isHomepageCurrentPage() {
    return this.router.url === '/';
  }

  public canSeeScenarioOptions(): boolean {
    return this.isAuthenticated() && this.authenticationService.isUserInRole(this.currentUser(), [RoleEnum.Admin, RoleEnum.DataExplorer]);
  }

  public isAdministrator(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.currentUser());
  }

  public isUnassigned(): boolean {
    return this.authenticationService.isUserUnassigned(this.currentUser());
  }

  public isUnassignedOrDisabled(): boolean {
    return this.authenticationService.isUserUnassigned(this.currentUser()) || this.authenticationService.isUserRoleDisabled(this.currentUser());
  }

  public getUserName() {
    return this.currentUser() ? this.currentUser().FullName
      : null;
  }

  public login(): void {
    this.authenticationService.login();
  }

  public logout(): void {
    // The deferred detectChanges() that used to follow is unnecessary: logout
    // clears the currentUser signal, which schedules the re-render itself.
    this.authenticationService.logout();
  }

  public leadOrganizationLogoSrc(): string {
    return 'assets/main/logos/nebula_logo.png';
  }
}
