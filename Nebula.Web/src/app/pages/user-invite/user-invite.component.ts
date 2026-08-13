import { Component, OnInit, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { AlertService } from 'src/app/shared/services/alert.service';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { forkJoin } from 'rxjs';
import { RoleDto, RoleService, UserDto, UserInviteDto, UserService } from 'src/app/shared/generated';



@Component({
  selector: 'nebula-user-invite',
  templateUrl: './user-invite.component.html',
  styleUrls: ['./user-invite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class UserInviteComponent implements OnInit {

  private authenticationService = inject(AuthenticationService);

  public roles = signal<Array<RoleDto>>([]);
  public model = signal<UserInviteDto>(null);
  public isLoadingSubmit = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.authenticationService.getCurrentUser().subscribe(() => {
      this.roleService.rolesGet().subscribe(result => {
        this.roles.set(result);
      });

      this.model.set(new UserInviteDto());

      const userID = parseInt(this.route.snapshot.paramMap.get('userID'));
      if (userID) {
        forkJoin([
          this.userService.usersUserIDGet(userID)
        ]).subscribe(([user]) => {
          if (user.GlobalUserID === null) {
            const userToInvite = user instanceof Array
              ? null
              : user as UserDto;
            // New object rather than in-place mutation: a signal only notifies
            // on identity change, and this population happens in an HTTP callback.
            this.model.set(Object.assign(new UserInviteDto(), {
              Email: userToInvite.Email,
              FirstName: userToInvite.FirstName,
              LastName: userToInvite.LastName,
              RoleID: userToInvite.Role.RoleID
            }));
          }
        });
      }
    });
  }

  canInviteUser(): boolean {
    const model = this.model();
    return model.FirstName && model.LastName && model.RoleID && model.Email && model.Email.indexOf('@') != -1;
  }

  onSubmit(inviteUserForm: HTMLFormElement): void {
    this.isLoadingSubmit.set(true);

    this.userService.usersInvitePost(this.model())
      .subscribe(response => {
        this.isLoadingSubmit.set(false);
        inviteUserForm.reset();
        this.router.navigateByUrl(`/users/${response.UserID}`).then(x => {
          this.alertService.pushAlert(new Alert('The user invite was successful.', AlertContext.Success));
        });
      }
        ,
        error => {
          this.isLoadingSubmit.set(false);
          }
      );
  }

  public currentUserIsAdmin(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.authenticationService.currentUser());
  }
}
