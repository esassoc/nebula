import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
    selector: 'nebula-login-callback',
    templateUrl: './login-callback.component.html',
    styleUrls: ['./login-callback.component.scss'],
    standalone: false
})
export class LoginCallbackComponent implements OnInit, OnDestroy {
  

  constructor(private router: Router, private authenticationService: AuthenticationService) { }

  ngOnInit() {
    this.authenticationService.getCurrentUserID().subscribe(currentUser => {
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

  ngOnDestroy(): void {
    
  }
}
