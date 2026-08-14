import { Component, OnInit, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { forkJoin } from 'rxjs';
import { UserDto, UserService } from 'src/app/shared/generated';

@Component({
    selector: 'template-user-detail',
    templateUrl: './user-detail.component.html',
    styleUrls: ['./user-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class UserDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  // inject() rather than a constructor param so this field initializer cannot
  // depend on parameter-property assignment order.
  private authenticationService = inject(AuthenticationService);

  // Read straight off the service signal instead of mirroring it into a field
  // via subscribe: signal reads inside a method called from the template are
  // tracked, so the view refreshes when the current user changes.
  private currentUser = this.authenticationService.currentUser;
  public user = signal<UserDto>(null);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {
    // force route reload whenever params change;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit() {
    // Still sequenced off the user stream: the detail fetch must wait until
    // authentication has resolved.
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const id = parseInt(this.route.snapshot.paramMap.get('id'));
      if (id) {
        forkJoin(
          this.userService.usersUserIDGet(id),
        ).subscribe(([user]) => {
          this.user.set(user instanceof Array
            ? null
            : user as UserDto);
        });
      }
    });
  }

  public currentUserIsAdmin(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.currentUser());
  }

  public userIsAdministrator(): boolean{
    return this.authenticationService.isUserAnAdministrator(this.user());
  }
}
