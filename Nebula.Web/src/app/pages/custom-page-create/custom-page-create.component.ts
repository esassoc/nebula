import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CustomPageService, CustomPageUpsertDto, MenuItemDto, MenuItemService, RoleDto, RoleService } from 'src/app/shared/generated';
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

export class CustomPageCreateComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  public menuItems = signal<Array<MenuItemDto>>([]);
  public roles = signal<Array<RoleDto>>([]);
  public model: CustomPageUpsertDto;
    
  public isLoadingSubmit = signal(false);
  private authenticationService = inject(AuthenticationService);
  private currentUser = this.authenticationService.currentUser;

  constructor(
    private router: Router,
    private customPageService: CustomPageService,
    private menuItemService: MenuItemService,
    private roleService: RoleService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.menuItemService.menuItemsGet().subscribe(result => {
        // only exposing learn more menu option for now, but will be easy to add others as needed
        this.menuItems.set(result.filter(x => x.MenuItemName == 'LearnMore'));
      });
      this.roleService.rolesGet().subscribe(roles => {
        // remove admin from role picker as admins default to viewable for all custom pages
        // and remove disabled users as well since they should not have viewable rights by default
        this.roles.set(roles.filter(role => 
          role.RoleID !== RoleEnum.Admin &&
                    role.RoleID !== RoleEnum.Disabled));
      });
      this.model = new CustomPageUpsertDto();
      this.model.ViewableRoleIDs = [];
      this.model.CustomPageContent = '';
    });
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
    this.isLoadingSubmit.set(true);

    this.customPageService.customPagesPost(this.model)
      .subscribe(response => {
        this.isLoadingSubmit.set(false);
        createNewCustomPageForm.reset();
        this.router.navigateByUrl(`/custom-pages/${response.CustomPageVanityUrl}`).then(() => {
          this.authenticationService.refreshUserInfo(this.currentUser());
          this.alertService.pushAlert(new Alert('The custom page was successfully created.', AlertContext.Success));
        });
      },
      error => {
        this.isLoadingSubmit.set(false);
      });
  }
}