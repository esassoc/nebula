import { Component, OnInit, signal, inject } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { AlertService } from 'src/app/shared/services/alert.service';
import { FieldDefinitionDto, FieldDefinitionService } from 'src/app/shared/generated';

@Component({
    selector: 'nebula-field-definition-edit',
    templateUrl: './field-definition-edit.component.html',
    styleUrls: ['./field-definition-edit.component.scss'],
    standalone: false
})
export class FieldDefinitionEditComponent implements OnInit {
  
  private authenticationService = inject(AuthenticationService);
  private currentUser = this.authenticationService.currentUser;

  public fieldDefinition = signal<FieldDefinitionDto>(null);

  public isLoadingSubmit = signal(false);

  constructor (
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private fieldDefinitionService: FieldDefinitionService
  ) {}

  ngOnInit() {
    this.authenticationService.getCurrentUser().subscribe(() => {
      const id = parseInt(this.route.snapshot.paramMap.get('id'));
      if (id) {
        this.fieldDefinitionService.fieldDefinitionsFieldDefinitionTypeIDGet(id).subscribe(fieldDefinition => {
          this.fieldDefinition.set(fieldDefinition);
        })
      }
    });
  }

  public currentUserIsAdmin(): boolean {
    return this.authenticationService.isUserAnAdministrator(this.currentUser());
  }

  saveDefinition(): void {
    this.isLoadingSubmit.set(true);

    this.fieldDefinitionService.fieldDefinitionsFieldDefinitionTypeIDPut(this.fieldDefinition().FieldDefinitionID, this.fieldDefinition())
      .subscribe(response => {
        this.isLoadingSubmit.set(false);
        this.router.navigateByUrl('/labels-and-definitions').then(x => {
          this.alertService.pushAlert(new Alert(`The definition for ${this.fieldDefinition().FieldDefinitionType.FieldDefinitionTypeDisplayName} was successfully updated.`, AlertContext.Success));
        });
      }, error => {
        this.isLoadingSubmit.set(false);
      }
      );
  }

}
