import { Component, OnInit, Input, ViewChild, signal, computed, inject } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { CustomRichTextDto, CustomRichTextService } from '../../generated';
import { EditorComponent } from '@tinymce/tinymce-angular';

@Component({
  selector: 'custom-rich-text',
  templateUrl: './custom-rich-text.component.html',
  styleUrls: ['./custom-rich-text.component.scss'],
  standalone: false
})
export class CustomRichTextComponent implements OnInit {
  @ViewChild('tinyMceEditor') tinyMceEditor: EditorComponent;
  public tinyMceConfig: object;

  private authenticationService = inject(AuthenticationService);

  @Input() customRichTextTypeID: number;
  // Signals: these are set from HTTP callbacks, which no longer schedule change
  // detection under zoneless.
  public customRichTextContent = signal<string>(null);
  public isLoading = signal(true);
  public isEditing = signal(false);
  public emptyContent = signal(false);
  public editedContent: string;
  public editor;

  // Derived from the auth signal rather than captured once via subscribe, so it
  // stays correct if the user resolves after this component initialises.
  public canEdit = computed(() =>
    this.authenticationService.isUserAnAdministrator(this.authenticationService.currentUser()));

  constructor(
    private customRichTextService: CustomRichTextService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.customRichTextService.publicCustomRichTextCustomRichTextTypeIDGet(this.customRichTextTypeID).subscribe(x => {
      this.customRichTextContent.set(x.CustomRichTextContent);
      // Renamed from isEmptyContent: the template has always read
      // `emptyContent`, so the empty-state branch could never render.
      this.emptyContent.set(x.IsEmptyContent);
      this.isLoading.set(false);
    });
  }

  public enterEdit(): void {
    this.editedContent = this.customRichTextContent();
    this.isEditing.set(true);
  }

  public cancelEdit(): void {
    this.isEditing.set(false);
  }

  public saveEdit(): void {
    this.isEditing.set(false);
    this.isLoading.set(true);
    const updateDto = new CustomRichTextDto({ CustomRichTextContent: this.editedContent });
    this.customRichTextService.customRichTextCustomRichTextTypeIDPut(this.customRichTextTypeID, updateDto).subscribe(x => {
      this.customRichTextContent.set(x.CustomRichTextContent);
      this.isLoading.set(false);
    }, error => {
      this.isLoading.set(false);
      this.alertService.pushAlert(new Alert('There was an error updating the rich text content', AlertContext.Danger, true));
    });
  }
}
