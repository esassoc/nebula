import { Component, OnInit, HostListener, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { Router } from '@angular/router';
import { RoleEnum } from '../../generated/enum/role-enum';
import { CustomPageService, CustomPageWithRolesDto, UserDto, UserService } from '../../generated';

@Component({
  selector: 'header-nav',
  templateUrl: './header-nav.component.html',
  styleUrls: ['./header-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})

export class HeaderNavComponent implements OnInit, OnDestroy {

  private currentUser: UserDto;

  windowWidth: number;

  public learnMorePages: CustomPageWithRolesDto[] = [];
  watchUserChangeSubscription: any;

  @HostListener('window:resize')
  resize() {
    this.windowWidth = window.innerWidth;
  }

  constructor(
    private authenticationService: AuthenticationService,
    private userService: UserService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private customPageService: CustomPageService,
    private router: Router
  ) { }


  ngOnInit() {
    // MP-AS 3-1-22 everywhere else fire and forget is fine, but if we need a refresh option, need to use currentUserSetObservable
    this.watchUserChangeSubscription = this.authenticationService.currentUser$.subscribe(currentUser => {
      this.currentUser = currentUser;
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
            .filter(x => x.ViewableRoles.map(role => role.RoleID).includes(this.currentUser?.Role?.RoleID));
          this.learnMorePages = customPagesWithRoles.filter(x => x.MenuItem.MenuItemName == 'LearnMore');
        });
      }
    });
  }

  ngOnDestroy() {
    this.watchUserChangeSubscription.unsubscribe();
    this.cdr.detach();
  }

  public isAuthenticated(): boolean {
    return this.authenticationService.isAuthenticated();
  }

  public isHomepageCurrentPage() {
    return this.router.url === '/';
  }

  public canSeeScenarioOptions(): boolean {
    return this.isAuthenticated() && this.authenticationService.isUserInRole(this.currentUser, [RoleEnum.Admin, RoleEnum.DataExplorer]);
  }

  public isAdministrator(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.currentUser);
  }

  public isUnassigned(): boolean {
    return this.authenticationService.isUserUnassigned(this.currentUser);
  }

  public isUnassignedOrDisabled(): boolean {
    return this.authenticationService.isUserUnassigned(this.currentUser) || this.authenticationService.isUserRoleDisabled(this.currentUser);
  }

  public getUserName() {
    return this.currentUser ? this.currentUser.FullName
      : null;
  }

  public login(): void {
    this.authenticationService.login();
  }

  public logout(): void {
    this.authenticationService.logout();

    setTimeout(() => {
      this.cdr.detectChanges();
    });
  }

  public leadOrganizationLogoSrc(): string {
    return 'assets/main/logos/nebula_logo.png';
  }
}
