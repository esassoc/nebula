import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
    this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
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
}
