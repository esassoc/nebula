import { inject, Injectable, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { AuthService } from "@auth0/auth0-angular";
import { AlertService } from '../shared/services/alert.service';
import { Alert } from '../shared/models/alert';
import { AlertContext } from '../shared/models/enums/alert-context.enum';
import { Observable, of } from "rxjs";
import { switchMap, } from "rxjs/operators";
import { UserDto, UserService } from '../shared/generated';
import { Router } from "@angular/router";
import { RoleEnum } from "../shared/generated/enum/role-enum";
import { environment } from 'src/environments/environment';
import { HttpErrorResponse } from "@angular/common/http";

@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  protected auth = inject(AuthService);
  protected userService: UserService = inject(UserService);
  protected alertService: AlertService = inject(AlertService);
  // The signal is the source of truth: templates that read it re-render under
  // zoneless change detection, which a ReplaySubject subscribe-and-assign does
  // not. currentUser$ is derived from it so components still on subscribe()
  // keep working while they are migrated one at a time.
  private readonly currentUserSignal = signal<UserDto | null>(null);
  public readonly currentUser = this.currentUserSignal.asReadonly();
  // Deliberately unfiltered: the service pushes null on logout / no-claims and
  // consumers (e.g. header-nav) rely on receiving it to clear their state.
  public readonly currentUser$: Observable<UserDto | null> = toObservable(this.currentUserSignal);
  private hasClaims: boolean;

  constructor(private router: Router) {
    this.auth.idTokenClaims$
      .pipe(
        switchMap((claims) => {
          if (!claims) {
            this.hasClaims = false;
            return of(null);
          }
          this.hasClaims = true;
          return this.userService.userClaimsPost();
        }),
      ).subscribe(
        (user) => {
          this.updateUser(user);
        },
      );

    this.auth.error$.subscribe((err: HttpErrorResponse) => {
      console.error("Auth0 Error:", err);
      this.alertService.pushAlert(new Alert(`An error occurred during authentication: ${err.message}`, AlertContext.Danger));
    });
  }

  public login() {
    this.auth.loginWithRedirect();
  }

  public logout() {
    this.auth.logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  }

  public forcedLogout() {
    sessionStorage.authRedirectUrl = window.location.href;
    this.logout();
  }


  public isUserAnAdministrator(user: UserDto): boolean {
    const role = user && user.Role
      ? user.Role.RoleID
      : null;
    return role === RoleEnum.Admin;
  }

  public isCurrentUserAnAdministrator(): boolean {
    return this.isUserAnAdministrator(this.currentUser());
  }

  public isUserUnassigned(user: UserDto): boolean {
    const role = user && user.Role
      ? user.Role.RoleID
      : null;
    return role === RoleEnum.Unassigned;
  }

  public isUserRoleDisabled(user: UserDto): boolean {
    const role = user && user.Role
      ? user.Role.RoleID
      : null;
    return role === RoleEnum.Disabled;
  }

  public isCurrentUserNullOrUndefined(): boolean {
    return !this.currentUser();
  }

  public hasCurrentUserAcknowledgedDisclaimer(): boolean {
    return this.currentUser() != null && this.currentUser().DisclaimerAcknowledgedDate != null;
  }

  public isUserInRole(user: UserDto, roles: RoleEnum[]): boolean {
    const role = user && user.Role ? user.Role.RoleID : null;
    if (role == null) {
      return false;
    }

    return roles.includes(role);
  }

  public isCurrentUserInRole(roles: RoleEnum[]): boolean {
    return this.isUserInRole(this.currentUser(), roles);
  }

  public isCurrentUserDisabled(): boolean {
    return this.isUserRoleDisabled(this.currentUser());
  }

  public doesCurrentUserHaveOneOfTheseRoles(roleIDs: Array<number>): boolean {
    if (roleIDs.length === 0) {
      return false;
    }
    const user = this.currentUser();
    const roleID = user && user.Role
      ? user.Role.RoleID
      : null;
    return roleIDs.includes(roleID);
  }

  private updateUser(user: UserDto | null) {
    this.currentUserSignal.set(user);
  }

  public refreshUserInfo(user: UserDto) {
    this.updateUser(user);
  }

  public getCurrentUser(): Observable<UserDto | null> {
    return this.currentUser$;
  }

  public isAuthenticated(): boolean {
    return this.hasClaims;
  }

  public createAccount() {
    this.auth.loginWithRedirect({ authorizationParams: { screen_hint: "signup" } } as any);
  }

  public getAuthRedirectUrl() {
    return sessionStorage.authRedirectUrl;
  }

  public setAuthRedirectUrl(url: string) {
    sessionStorage.authRedirectUrl = url;
  }

  public clearAuthRedirectUrl() {
    this.setAuthRedirectUrl('');
  }
}