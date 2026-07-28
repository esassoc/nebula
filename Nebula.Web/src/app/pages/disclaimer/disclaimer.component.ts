import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service'
import { UserDto, UserService } from 'src/app/shared/generated';
import { CustomRichTextTypeEnum } from 'src/app/shared/generated/enum/custom-rich-text-type-enum';

@Component({
    selector: 'nebula-disclaimer',
    templateUrl: './disclaimer.component.html',
    styleUrls: ['./disclaimer.component.scss'],
    standalone: false
})
export class DisclaimerComponent implements OnInit {

  private watchUserChangeSubscription : any;
  private currentUser : UserDto;
  private forced : boolean = true;
  private returnRoute : string = '';
  public richTextTypeID : number = CustomRichTextTypeEnum.Disclaimer;
  returnQueryParams: any;

  constructor(
    private userService: UserService,
    private authenticationService : AuthenticationService,
    private router : Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
    });
    this.route.queryParams.subscribe(params => {
      this.returnRoute =  params.route || '/';
      this.returnQueryParams = params.queryParams || null;
    });
    this.forced = this.route.snapshot.paramMap.get('forced') === 'true';
  }

  public checkDisclaimerAcknowledged(): boolean {
    return !this.currentUser || (!this.forced && this.currentUser.DisclaimerAcknowledgedDate != null) ? false : true;
  }

  public setDisclaimerAcknowledged(): void {
    this.userService.usersSetDisclaimerAcknowledgedDatePut(this.currentUser.UserID).subscribe(x=>{
      this.authenticationService.refreshUserInfo(x);

      this.router.navigate([this.returnRoute], {queryParams : JSON.parse(this.returnQueryParams)});
    });
  }

}
