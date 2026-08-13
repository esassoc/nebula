import { Component, OnInit, ViewChild, signal, inject } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { ColDef } from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { CustomRichTextTypeEnum } from 'src/app/shared/generated/enum/custom-rich-text-type-enum';
import { FieldDefinitionDto, FieldDefinitionService, UserDto } from 'src/app/shared/generated';

@Component({
    selector: 'nebula-field-definition-list',
    templateUrl: './field-definition-list.component.html',
    styleUrls: ['./field-definition-list.component.scss'],
    standalone: false
})
export class FieldDefinitionListComponent implements OnInit {

  @ViewChild('fieldDefinitionsGrid') fieldDefinitionsGrid: AgGridAngular;
  
  private authenticationService = inject(AuthenticationService);
  private currentUser = this.authenticationService.currentUser;

  // Signals: assigned from an HTTP callback, which no longer schedules change
  // detection on its own under zoneless.
  public fieldDefinitions = signal<Array<FieldDefinitionDto>>(null);
  public richTextTypeID : number = CustomRichTextTypeEnum.LabelsAndDefinitionsList;

  public rowData = signal<Array<FieldDefinitionDto>>([]);
  public columnDefs = signal<ColDef[]>([]);

  constructor(
    private fieldDefinitionService: FieldDefinitionService) { }

  ngOnInit() {
    this.authenticationService.getCurrentUser().subscribe(() => {
      this.fieldDefinitionsGrid?.api.showLoadingOverlay();
      this.fieldDefinitionService.fieldDefinitionsGet().subscribe(fieldDefinitions => {
        this.fieldDefinitions.set(fieldDefinitions);
        this.rowData.set(fieldDefinitions);
        this.fieldDefinitionsGrid?.api.hideOverlay();
      });
      const columnDefs: ColDef[] = [
        {
          headerName: 'Label', valueGetter: function (params: any) {
            return { LinkValue: params.data.FieldDefinitionType.FieldDefinitionTypeID, LinkDisplay: params.data.FieldDefinitionType.FieldDefinitionTypeDisplayName };
          }, cellRenderer: LinkRendererComponent,
          cellRendererParams: { inRouterLink: '/labels-and-definitions/' },
          filterValueGetter: function (params: any) {
            return params.data.FieldDefinitionType.FieldDefinitionDisplayName;
          },
          comparator: function (id1: any, id2: any) {
            const link1 = id1.LinkDisplay;
            const link2 = id2.LinkDisplay;
            if (link1 < link2) {
              return -1;
            }
            if (link1 > link2) {
              return 1;
            }
            return 0;
          },
          sortable: true, filter: true, width:200
        },
        { headerName: 'Definition', field: 'FieldDefinitionValue',  
          cellRenderer:function (params: any) { 
            return params.data.FieldDefinitionValue ? params.data.FieldDefinitionValue : ''
          },
          autoHeight:true, sortable: true, filter: true, width:900, cellStyle: {'white-space': 'normal'}},
      ];

      columnDefs.forEach(x => {
        x.resizable = true;
      });
      this.columnDefs.set(columnDefs);
    });
  }
}
