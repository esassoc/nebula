import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CustomPageService, CustomPageUpsertDto, MenuItemDto, MenuItemService, RoleDto, RoleService, UserDto } from 'src/app/shared/generated';
import { RoleEnum } from 'src/app/shared/generated/enum/role-enum';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';

import { AlertService } from 'src/app/shared/services/alert.service';

@Component({
    selector: 'nebula-custom-page-create',
    templateUrl: './custom-page-create.component.html',
    styleUrls: ['./custom-page-create.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})

export class CustomPageCreateComponent implements OnInit, OnDestroy {
  private watchUserChangeSubscription: any;

  public menuItems: Array<MenuItemDto>;
  public roles: Array<RoleDto>;
  public model: CustomPageUpsertDto;
    
  public isLoadingSubmit: boolean = false;
  private currentUser: UserDto;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router, 
    private customPageService: CustomPageService,
    private menuItemService: MenuItemService,
    private roleService: RoleService,
    private authenticationService: AuthenticationService, 
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.watchUserChangeSubscription = this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
      this.menuItemService.menuItemsGet().subscribe(result => {
        // only exposing learn more menu option for now, but will be easy to add others as needed
        this.menuItems = result.filter(x => x.MenuItemName == 'LearnMore');
        this.cdr.detectChanges();
      });
      this.roleService.rolesGet().subscribe(roles => {
        // remove admin from role picker as admins default to viewable for all custom pages
        // and remove disabled users as well since they should not have viewable rights by default
        this.roles = roles.filter(role => 
          role.RoleID !== RoleEnum.Admin &&
                    role.RoleID !== RoleEnum.Disabled);
        this.cdr.detectChanges();
      });
      this.model = new CustomPageUpsertDto();
      this.model.ViewableRoleIDs = [];
      this.model.CustomPageContent = '';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.cdr.detach();
  }

  slugifyPageName(event: any): void {
    const urlSlug = event?.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    this.model.CustomPageVanityUrl = urlSlug;
  }    

  onViewableRolesChange(roleID: number): void {
    if (!this.model.ViewableRoleIDs.includes(roleID)) {
      this.model.ViewableRoleIDs.push(roleID);
    } else {
      this.model.ViewableRoleIDs = 
            this.model.ViewableRoleIDs.filter(x => x != roleID)
              .sort();
    }
  }
    
  validPageName(pageName: string): boolean {
    const pattern = /^[_A-Za-z0-9\-\s]{1,100}$/;
    return pattern.test(pageName);
  }

  validVanityUrl(vanityUrl: string): boolean {
    const pattern = /^[_A-Za-z0-9\-]{1,100}$/;
    return pattern.test(vanityUrl);
  }

  onSubmit(createNewCustomPageForm: HTMLFormElement): void {
    this.isLoadingSubmit = true;

    this.customPageService.customPagesPost(this.model)
      .subscribe(response => {
        this.isLoadingSubmit = false;
        createNewCustomPageForm.reset();
        this.router.navigateByUrl(`/custom-pages/${response.CustomPageVanityUrl}`).then(() => {
          this.authenticationService.refreshUserInfo(this.currentUser);
          this.alertService.pushAlert(new Alert('The custom page was successfully created.', AlertContext.Success));
        });
      },
      error => {
        this.isLoadingSubmit = false;
        this.cdr.detectChanges();
      });
  }
}