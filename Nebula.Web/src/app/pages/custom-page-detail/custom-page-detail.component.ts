import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { AlertService } from 'src/app/shared/services/alert.service';
import { CustomPageDto, CustomPageService, CustomPageUpsertDto, UserDto } from 'src/app/shared/generated';
import { EditorComponent } from '@tinymce/tinymce-angular';
import TinyMCEHelpers from 'src/app/shared/helpers/tiny-mce-helpers';

@Component({
    selector: 'nebula-custom-page-detail',
    templateUrl: './custom-page-detail.component.html',
    styleUrls: ['./custom-page-detail.component.scss'],
    standalone: false
})
export class CustomPageDetailComponent implements OnInit, AfterViewChecked {
  @ViewChild('tinyMceEditor') tinyMceEditor: EditorComponent;
  public tinyMceConfig: object;
  
  @Input() customPageVanityUrl: string;
  public customPageContent: SafeHtml;
  public customPageDisplayName: string;
  public viewableRoleIDs: Array<number>;
  public isLoading: boolean = true;
  public isEditing: boolean = false;
  public isEmptyContent: boolean = false;
  
  public watchUserChangeSubscription: any;
  public editor;
  public editedContent: string;
  
  private currentUser: UserDto;
  public customPage: CustomPageDto;

  constructor(
    private customPageService: CustomPageService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer) {
    // force route reload whenever params change
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit() {
    this.watchUserChangeSubscription = this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
    });

    const vanityUrl = this.route.snapshot.paramMap.get('vanity-url');

    if (vanityUrl) {
      this.customPageService.customPagesGetByURLCustomPageVanityURLGet(vanityUrl).subscribe(customPage => {
        this.loadCustomPage(customPage);
        this.customPageContent = this.sanitizer.bypassSecurityTrustHtml(customPage.CustomPageContent);
        this.customPageDisplayName = customPage.CustomPageDisplayName;
        this.editedContent = customPage.CustomPageContent;
      });
      this.customPageService.customPagesGetByURLCustomPageVanityURLRolesGet(vanityUrl).subscribe(pageRoleDtos => {
        this.viewableRoleIDs = pageRoleDtos.map(pageRole => pageRole.RoleID);
      });
    }
  }

  ngAfterViewChecked() {
    // viewChild is updated after the view has been checked
    this.initalizeEditor();
  }

  initalizeEditor() {
    if (!this.isLoading && this.isEditing) {
      this.tinyMceConfig = TinyMCEHelpers.DefaultInitConfig(
        this.tinyMceEditor
      );
    }
  }

  ngOnDestroy() {
    this.cdr.detach();
  }

  public isUserAnAdministrator(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.currentUser);
  }

  public showEditButton(): boolean {
    return this.isUserAnAdministrator();
  }

  public enterEdit(): void {
    this.isEditing = true;
  }

  public cancelEdit(): void {
    this.isEditing = false;
  }

  public saveEdit(): void {
    this.isEditing = false;
    this.isLoading = true;
    const updateDto = new CustomPageUpsertDto({
      CustomPageDisplayName: this.customPageDisplayName,
      CustomPageVanityUrl: this.customPage.CustomPageVanityUrl,
      CustomPageContent: this.editedContent,
      MenuItemID: this.customPage.MenuItem.MenuItemID,
      ViewableRoleIDs: this.viewableRoleIDs
    });

    this.customPageService.customPagesCustomPageIDPut(this.customPage.CustomPageID, updateDto).subscribe(x => {
      this.customPageContent = this.sanitizer.bypassSecurityTrustHtml(x.CustomPageContent);
      this.editedContent = x.CustomPageContent;
      this.isLoading = false;
    }, error => {
      this.isLoading = false;
      this.alertService.pushAlert(new Alert('There was an error updating the rich text content', AlertContext.Danger, true));
    });
  }

  private loadCustomPage(customPage: CustomPageDto)
  {
    this.customPage = customPage; 
    this.isEmptyContent = !!customPage.CustomPageContent;
    this.isLoading = false;
  }

  public isUploadingImage(): boolean {
    return this.editor && this.editor.isReadOnly;
  }

}
