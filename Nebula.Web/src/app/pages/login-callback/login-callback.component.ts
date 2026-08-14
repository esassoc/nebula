import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
  selector: 'nebula-login-callback',
  templateUrl: './login-callback.component.html',
  styleUrls: ['./login-callback.component.scss'],
  standalone: false
})
export class LoginCallbackComponent implements OnInit {
  private destroyRef = inject(DestroyRef);


  constructor(private router: Router, private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(currentUser => {
      const redirect = this.authenticationService.getAuthRedirectUrl();
      if (redirect) {
        this.authenticationService.clearAuthRedirectUrl();
        this.router.navigate([redirect]);
      }
      else {
        this.router.navigate(['/']);
      }
    });
  }

}
