import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';

@Component({
    selector: 'nebula-create-user-callback',
    templateUrl: './create-user-callback.component.html',
    styleUrls: ['./create-user-callback.component.scss'],
    standalone: false
})
export class CreateUserCallbackComponent implements OnInit {

  constructor(private authenticationService:AuthenticationService) { }

  ngOnInit() {
    this.authenticationService.login();
  }

}
