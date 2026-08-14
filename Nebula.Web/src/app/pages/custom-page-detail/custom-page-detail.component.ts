import { AfterViewChecked, Component, Input, OnInit, ViewChild, signal, inject } from '@angular/core';
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
  public customPageContent = signal<SafeHtml>(null);
  public customPageDisplayName = signal<string>(null);
  public viewableRoleIDs = signal<Array<number>>([]);
  public isLoading = signal(true);
  public isEditing = signal(false);
  public emptyContent = signal(false);
  
  public editor;
  public editedContent: string;
  
  private authenticationService = inject(AuthenticationService);
  private currentUser = this.authenticationService.currentUser;
  public customPage = signal<CustomPageDto>(null);

  constructor(
    private customPageService: CustomPageService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private sanitizer: DomSanitizer) {
    // force route reload whenever params change
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit() {
    const vanityUrl = this.route.snapshot.paramMap.get('vanity-url');

    if (vanityUrl) {
      this.customPageService.customPagesGetByURLCustomPageVanityURLGet(vanityUrl).subscribe(customPage => {
        this.loadCustomPage(customPage);
        this.customPageContent.set(this.sanitizer.bypassSecurityTrustHtml(customPage.CustomPageContent));
        this.customPageDisplayName.set(customPage.CustomPageDisplayName);
        this.editedContent = customPage.CustomPageContent;
      });
      this.customPageService.customPagesGetByURLCustomPageVanityURLRolesGet(vanityUrl).subscribe(pageRoleDtos => {
        this.viewableRoleIDs.set(pageRoleDtos.map(pageRole => pageRole.RoleID));
      });
    }
  }

  ngAfterViewChecked() {
    // viewChild is updated after the view has been checked
    this.initalizeEditor();
  }

  initalizeEditor() {
    if (!this.isLoading() && this.isEditing()) {
      this.tinyMceConfig = TinyMCEHelpers.DefaultInitConfig(
        this.tinyMceEditor
      );
    }
  }

  public isUserAnAdministrator(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.currentUser());
  }

  public showEditButton(): boolean {
    return this.isUserAnAdministrator();
  }

  public enterEdit(): void {
    this.isEditing.set(true);
  }

  public cancelEdit(): void {
    this.isEditing.set(false);
  }

  public saveEdit(): void {
    this.isEditing.set(false);
    this.isLoading.set(true);
    const updateDto = new CustomPageUpsertDto({
      CustomPageDisplayName: this.customPageDisplayName(),
      CustomPageVanityUrl: this.customPage().CustomPageVanityUrl,
      CustomPageContent: this.editedContent,
      MenuItemID: this.customPage().MenuItem.MenuItemID,
      ViewableRoleIDs: this.viewableRoleIDs()
    });

    this.customPageService.customPagesCustomPageIDPut(this.customPage().CustomPageID, updateDto).subscribe(x => {
      this.customPageContent.set(this.sanitizer.bypassSecurityTrustHtml(x.CustomPageContent));
      this.editedContent = x.CustomPageContent;
      this.isLoading.set(false);
    }, error => {
      this.isLoading.set(false);
      this.alertService.pushAlert(new Alert('There was an error updating the rich text content', AlertContext.Danger, true));
    });
  }

  private loadCustomPage(customPage: CustomPageDto)
  {
    this.customPage.set(customPage);
    // ! not !!: the flag means "there is no content", and the template renders
    // the empty-state block when it is true.
    this.emptyContent.set(!customPage.CustomPageContent);
    this.isLoading.set(false);
  }

  public isUploadingImage(): boolean {
    return this.editor && this.editor.isReadOnly;
  }

}
