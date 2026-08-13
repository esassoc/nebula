import { Component, OnInit, inject } from '@angular/core';
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

  private authenticationService = inject(AuthenticationService);

  // Read off the service signal: checkDisclaimerAcknowledged() is called from
  // the template, so the signal read there keeps the view in sync.
  private currentUser = this.authenticationService.currentUser;
  private forced : boolean = true;
  private returnRoute : string = '';
  public richTextTypeID : number = CustomRichTextTypeEnum.Disclaimer;
  returnQueryParams: any;

  constructor(
    private userService: UserService,
    private router : Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.returnRoute =  params.route || '/';
      this.returnQueryParams = params.queryParams || null;
    });
    this.forced = this.route.snapshot.paramMap.get('forced') === 'true';
  }

  public checkDisclaimerAcknowledged(): boolean {
    const currentUser = this.currentUser();
    return !currentUser || (!this.forced && currentUser.DisclaimerAcknowledgedDate != null) ? false : true;
  }

  public setDisclaimerAcknowledged(): void {
    this.userService.usersSetDisclaimerAcknowledgedDatePut(this.currentUser().UserID).subscribe(x=>{
      this.authenticationService.refreshUserInfo(x);

      this.router.navigate([this.returnRoute], {queryParams : JSON.parse(this.returnQueryParams)});
    });
  }

}
