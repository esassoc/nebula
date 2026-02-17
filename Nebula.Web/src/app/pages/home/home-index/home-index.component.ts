import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { environment } from 'src/environments/environment';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomRichTextTypeEnum } from 'src/app/shared/generated/enum/custom-rich-text-type-enum';
import { RoleEnum } from 'src/app/shared/generated/enum/role-enum';
import { UserDto } from 'src/app/shared/generated';

@Component({
    selector: 'app-home-index',
    templateUrl: './home-index.component.html',
    styleUrls: ['./home-index.component.scss'],
    standalone: false
})
export class HomeIndexComponent implements OnInit, OnDestroy {
  public watchUserChangeSubscription: any;
  public currentUser: UserDto;

  public richTextTypeID: number = CustomRichTextTypeEnum.Homepage;

  constructor(private authenticationService: AuthenticationService,
              private router: Router,
              private route: ActivatedRoute) {
  }

  public ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      //We're logging in
      if (params.hasOwnProperty('code')) {
        this.router.navigate(['/signin-oidc'], { queryParams : params });
        return;
      }

      if (localStorage.getItem('loginOnReturn')) {
        localStorage.removeItem('loginOnReturn');
        this.authenticationService.login();
      }
    
      //We were forced to logout or were sent a link and just finished logging in
      if (this.authenticationService.getAuthRedirectUrl()) {
        this.router.navigateByUrl(this.authenticationService.getAuthRedirectUrl())
          .then(() => {
            this.authenticationService.clearAuthRedirectUrl();
          });
      }
    
      this.authenticationService.getCurrentUser().subscribe(currentUser => {
        this.currentUser = currentUser;
      });

    });
  }

  ngOnDestroy(): void {
    this.watchUserChangeSubscription?.unsubscribe();
  }

  public userIsUnassigned() {
    if (!this.currentUser) {
      return false; // doesn't exist != unassigned
    }

    return this.currentUser.Role.RoleID == RoleEnum.Unassigned;
  }

  public userRoleIsDisabled() {
    if (!this.currentUser) {
      return false; // doesn't exist != unassigned
    }

    return this.currentUser.Role.RoleID == RoleEnum.Disabled;
  }

  public isUserAnAdministrator() {
    return this.authenticationService.isUserAnAdministrator(this.currentUser);
  }

  public login(): void {
    this.authenticationService.login();
  }

  public createAccount(): void {
    this.authenticationService.createAccount();
  }

  public forgotPasswordUrl(): string {
    return `${environment.keystoneAuthConfiguration.issuer}/Account/ForgotPassword?${this.authenticationService.getClientIDAndRedirectUrlForKeystone()}`;
  }

  public forgotUsernameUrl(): string {
    return `${environment.keystoneAuthConfiguration.issuer}/Account/ForgotUsername?${this.authenticationService.getClientIDAndRedirectUrlForKeystone()}`;
  }

  public keystoneSupportUrl(): string {
    return `${environment.keystoneAuthConfiguration.issuer}/Account/Support/20?${this.authenticationService.getClientIDAndRedirectUrlForKeystone()}`;
  }
}
