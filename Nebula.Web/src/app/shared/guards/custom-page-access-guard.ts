import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';
import { AlertService } from '../services/alert.service';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CustomPageService } from '../generated';
@Injectable({
  providedIn: 'root'
})
export class CustomPageAccessGuard {
  constructor(
    private router: Router,
    private alertService: AlertService,
    private authenticationService: AuthenticationService,
    private customPageService: CustomPageService
  ) { }

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const vanityUrl = next.paramMap.get('vanity-url');
    let viewableRoleIDs = Array<number>();
    if (vanityUrl) {
      viewableRoleIDs = await this.getCustomPageRoleIDsByVanityUrl(vanityUrl);
      if (!this.authenticationService.isCurrentUserNullOrUndefined()) {
        if (this.authenticationService.doesCurrentUserHaveOneOfTheseRoles(viewableRoleIDs)) {
          return true;
        }
        return this.returnUnauthorized();
      }

      return this.authenticationService.getCurrentUser().toPromise().then(x => {
        if (viewableRoleIDs.includes(x.Role.RoleID)) {
          return true;
        } else {
          return this.returnUnauthorized();
        }
      })
    } else {
      return this.returnUnauthorized();
    }
  }

  private returnUnauthorized() {
    this.router.navigate(['/']).then(() => {
      this.alertService.pushNotFoundUnauthorizedAlert();
    });
    return false;
  }

  async getCustomPageRoleIDsByVanityUrl(vanityUrl: string): Promise<Array<number>> {

    return new Promise((resolve, reject) => {

      this.customPageService.customPagesGetByURLCustomPageVanityURLRolesGet(vanityUrl).subscribe(roles => {
        const viewableRoleIDs = roles.map(x => x.RoleID);
        resolve(viewableRoleIDs)
      },
        error => {
          const errorMessage = <any>error;
          if (errorMessage != null) {
            reject(errorMessage);
          }
        }
      );

    })
  }

}
