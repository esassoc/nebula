import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AlertService } from 'src/app/shared/services/alert.service';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { RoleDto, RoleService, UserDto, UserService, UserUpsertDto } from 'src/app/shared/generated';


@Component({
    selector: 'nebula-user-edit',
    templateUrl: './user-edit.component.html',
    styleUrls: ['./user-edit.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class UserEditComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  private authenticationService = inject(AuthenticationService);

  public userID: number;
  // Signals: set from HTTP callbacks. `model` stays a plain field because it is
  // the ngModel target for the edit form and is mutated by template bindings,
  // which mark the view dirty on their own.
  public user = signal<UserDto>(null);
  public roles = signal<Array<RoleDto>>([]);
  public isLoadingSubmit = signal(false);
  public model: UserUpsertDto;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService,
    private alertService: AlertService
  ) {
  }

  ngOnInit() {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(currentUser => {
      if (!this.authenticationService.isUserAnAdministrator(currentUser)) {
        this.router.navigateByUrl('/not-found')
          .then();
        return;
      }

      this.userID = parseInt(this.route.snapshot.paramMap.get('id'));

      forkJoin([
        this.userService.usersUserIDGet(this.userID),
        this.roleService.rolesGet()
      ]).subscribe(([user, roles]) => {
        this.user.set(user instanceof Array
          ? null
          : user as UserDto);

        this.roles.set(roles.sort((a: RoleDto, b: RoleDto) => {
          if (a.RoleDisplayName > b.RoleDisplayName)
            return 1;
          if (a.RoleDisplayName < b.RoleDisplayName)
            return -1;
          return 0;
        }));

        this.model = new UserUpsertDto();
        this.model.RoleID = user.Role.RoleID;
        this.model.ReceiveSupportEmails = user.ReceiveSupportEmails;
      });
    });
  }

  onSubmit(editUserForm: HTMLFormElement): void {
    this.isLoadingSubmit.set(true);

    this.userService.usersUserIDPut(this.userID, this.model)
      .subscribe(response => {
        this.isLoadingSubmit.set(false);
        this.router.navigateByUrl('/users/' + this.userID).then(x => {
          this.alertService.pushAlert(new Alert('The user was successfully updated.', AlertContext.Success));
        });
      }
      ,
      error => {
        this.isLoadingSubmit.set(false);
      }
      );
  }

  checkReceiveSupportEmails(): void {
    if (this.model.RoleID != 1){
      this.model.ReceiveSupportEmails = false;
    }
  }
}