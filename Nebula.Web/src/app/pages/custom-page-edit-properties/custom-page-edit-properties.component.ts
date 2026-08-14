import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CustomPageDto, CustomPageService, CustomPageUpsertDto, MenuItemDto, MenuItemService, RoleDto, RoleService, UserDto } from 'src/app/shared/generated';
import { RoleEnum } from 'src/app/shared/generated/enum/role-enum';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { AlertService } from 'src/app/shared/services/alert.service';

@Component({
    selector: 'nebula-custom-page-edit-properties',
    templateUrl: './custom-page-edit-properties.component.html',
    styleUrls: ['./custom-page-edit-properties.component.scss'],
    standalone: false
})
export class CustomPageEditPropertiesComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  
  private authenticationService = inject(AuthenticationService);
  public currentUser = this.authenticationService.currentUser;
  public menuItems = signal<Array<MenuItemDto>>([]);
  public roles = signal<Array<RoleDto>>([]);
  public model: CustomPageUpsertDto;
  public customPage = signal<CustomPageDto>(null);
  
  public isLoading = signal(true);
  public isLoadingSubmit = signal(false);

  constructor(
    private customPageService: CustomPageService,
    private menuItemService: MenuItemService,
    private roleService: RoleService,
    private route: ActivatedRoute,     
    private router: Router, 
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.model = new CustomPageUpsertDto();
      const vanityUrl = this.route.snapshot.paramMap.get('vanity-url');
      if (vanityUrl) {
        this.customPageService.customPagesGetByURLCustomPageVanityURLRolesGet(vanityUrl).subscribe(pageRoleDtos => {
          this.model.ViewableRoleIDs = pageRoleDtos.map(pageRole => pageRole.RoleID).sort();
        });
        this.customPageService.customPagesGetByURLCustomPageVanityURLGet(vanityUrl).subscribe(customPage => {
          this.customPage.set(customPage);
          this.model.CustomPageDisplayName = customPage.CustomPageDisplayName;
          this.model.CustomPageVanityUrl = customPage.CustomPageVanityUrl;
          this.model.CustomPageContent = customPage.CustomPageContent;
          this.model.MenuItemID = customPage.MenuItem.MenuItemID;
        });
        this.isLoading.set(false);
      }
  
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

  onSubmit(updateCustomPagePropertiesForm: HTMLFormElement): void {
    this.isLoadingSubmit.set(true);

    this.customPageService.customPagesCustomPageIDPut(this.customPage().CustomPageID, this.model)
      .subscribe(response => {
        this.isLoadingSubmit.set(false);
        updateCustomPagePropertiesForm.reset();
        this.router.navigateByUrl(`/custom-pages`).then(() => {
          this.alertService.pushAlert(new Alert(`The custom page ${response.CustomPageDisplayName} was successfully updated.`, AlertContext.Success));
        });
      },
      error => {
        this.isLoadingSubmit.set(false);
      });
  }
}

