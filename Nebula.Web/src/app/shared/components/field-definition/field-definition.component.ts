import { Component, OnInit, Input, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { Alert } from '../../models/alert';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { AlertService } from '../../services/alert.service';
import { AlertContext } from '../../models/enums/alert-context.enum';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';
import { FieldDefinitionTypeEnum } from '../../generated/enum/field-definition-type-enum';
import { FieldDefinitionDto, FieldDefinitionService } from '../../generated';

declare let $: any

@Component({
  selector: 'field-definition',
  templateUrl: './field-definition.component.html',
  styleUrls: ['./field-definition.component.scss'],
  standalone: false
})
export class FieldDefinitionComponent implements OnInit {

  @Input() fieldDefinitionType: string;
  @ViewChild('p') public popover: NgbPopover;
  @ViewChild('popContent') public content: any;
  private authenticationService = inject(AuthenticationService);

  // Signals: set from HTTP callbacks, which no longer schedule change detection
  // under zoneless.
  public fieldDefinition = signal<FieldDefinitionDto>(null);
  public isLoading = signal(true);
  public isEditing = signal(false);
  public emptyContent = signal(false);
  public editedContent: string;

  // Derived rather than captured once in ngOnInit: previously canEdit was read
  // before the current user had necessarily resolved, so it could latch false.
  public canEdit = computed(() =>
    this.authenticationService.isUserAnAdministrator(this.authenticationService.currentUser()));

  constructor(
    private fieldDefinitionService: FieldDefinitionService,
    private alertService: AlertService,
    private elem: ElementRef
  ) { }

  ngOnInit() {
    this.fieldDefinitionService.fieldDefinitionsFieldDefinitionTypeIDGet(FieldDefinitionTypeEnum[this.fieldDefinitionType]).subscribe(x => {
      this.loadFieldDefinition(x);
    });
  }

  public enterEdit(): void {
    this.editedContent = this.fieldDefinition().FieldDefinitionValue ?? '';
    this.isEditing.set(true);
  }

  public cancelEdit(): void {
    this.isEditing.set(false);
    this.popover.close();
  }

  public saveEdit(): void {
    this.isEditing.set(false);
    this.isLoading.set(true);
    const fieldDefinition = this.fieldDefinition();
    fieldDefinition.FieldDefinitionValue = this.editedContent;
    this.fieldDefinitionService.fieldDefinitionsFieldDefinitionTypeIDPut(fieldDefinition.FieldDefinitionID, fieldDefinition).subscribe(x => {
      this.loadFieldDefinition(x);
    }, error => {
      this.isLoading.set(false);
      this.alertService.pushAlert(new Alert('There was an error updating the field definition', AlertContext.Danger, true));
    });
  }

  private loadFieldDefinition(fieldDefinition: FieldDefinitionDto) {
    this.fieldDefinition.set(fieldDefinition);
    this.emptyContent.set(fieldDefinition.FieldDefinitionValue?.length > 0 ? false : true);
    this.isLoading.set(false);
  }

  public notEditingMouseEnter() {
    if (!this.isEditing) {
      this.popover.open();
      this.elem.nativeElement.closest('body')
        .querySelector('.popover')
        .addEventListener('mouseleave', this.mouseLeaveEvent.bind(this));
    }
  }

  public mouseLeaveEvent() {
    if (!this.isEditing) {
      this.popover.close();
    }
  }

  public notEditingMouseLeave() {
    setTimeout(() => {
      const hoveringPopover = this.elem.nativeElement.closest('body')
        .querySelector('.popover:hover')
      if (!hoveringPopover && !this.isEditing) {
        this.popover.close();
      }
    }, 50);
  }
}
