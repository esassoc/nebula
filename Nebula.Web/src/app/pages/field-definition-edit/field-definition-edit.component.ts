import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { AlertService } from 'src/app/shared/services/alert.service';
import { FieldDefinitionDto, FieldDefinitionService, UserDto } from 'src/app/shared/generated';
import { Observable } from 'rxjs';

@Component({
    selector: 'nebula-field-definition-edit',
    templateUrl: './field-definition-edit.component.html',
    styleUrls: ['./field-definition-edit.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class FieldDefinitionEditComponent implements OnInit {
  
  private currentUser: UserDto;
  public currentUser$: Observable<UserDto>;

  public fieldDefinition: FieldDefinitionDto;

  public isLoadingSubmit: boolean;

  constructor (
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private fieldDefinitionService: FieldDefinitionService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
      const id = parseInt(this.route.snapshot.paramMap.get('id'));
      if (id) {
        this.fieldDefinitionService.fieldDefinitionsFieldDefinitionTypeIDGet(id).subscribe(fieldDefinition => {
          this.fieldDefinition = fieldDefinition;
        })
      }
    });
  }

  ngOnDestroy() {
    this.cdr.detach();
  }
  
  public currentUserIsAdmin(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.currentUser);
  }

  saveDefinition(): void {
    this.isLoadingSubmit = true;

    this.fieldDefinitionService.fieldDefinitionsFieldDefinitionTypeIDPut(this.fieldDefinition.FieldDefinitionID, this.fieldDefinition)
      .subscribe(response => {
        this.isLoadingSubmit = false;
        this.router.navigateByUrl('/labels-and-definitions').then(x => {
          this.alertService.pushAlert(new Alert(`The definition for ${this.fieldDefinition.FieldDefinitionType.FieldDefinitionTypeDisplayName} was successfully updated.`, AlertContext.Success));
        });
      }, error => {
        this.isLoadingSubmit = false;
        this.cdr.detectChanges();
      }
      );
  }

}
