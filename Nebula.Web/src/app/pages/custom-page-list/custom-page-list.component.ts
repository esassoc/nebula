import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { FontAwesomeIconLinkRendererComponent } from 'src/app/shared/components/ag-grid/fontawesome-icon-link-renderer/fontawesome-icon-link-renderer.component';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { CustomDropdownFilterComponent } from 'src/app/shared/components/custom-dropdown-filter/custom-dropdown-filter.component';
import { CustomPageService, UserDto } from 'src/app/shared/generated';
import { CustomRichTextTypeEnum } from 'src/app/shared/generated/enum/custom-rich-text-type-enum';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { AlertService } from 'src/app/shared/services/alert.service';

@Component({
    selector: 'nebula-custom-page-list',
    templateUrl: './custom-page-list.component.html',
    styleUrls: ['./custom-page-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CustomPageListComponent implements OnInit, OnDestroy {
  @ViewChild('pageGrid') pageGrid: AgGridAngular;
  @ViewChild('deletePageModal') deleteEntity: any;
  
  public richTextTypeID : number = CustomRichTextTypeEnum.CustomPages;
  public rowData = [];
  public columnDefs: ColDef[];
  
  private gridApi: any;

  public modalReference: NgbModalRef;
  public customPageIDToRemove: number;
  public currentUser: UserDto;
  public isPerformingAction: boolean = false;
  public closeResult: string;
  public watchUserChangeSubscription: any;

  constructor(
    private alertService: AlertService,
    private cdr: ChangeDetectorRef, 
    private authenticationService: AuthenticationService,
    private customPageService: CustomPageService,
    private modalService: NgbModal,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeGrid();

    this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
      
      this.customPageService.customPagesWithRolesGet().subscribe(customPagesWithRoles => {
        this.rowData = customPagesWithRoles;
        this.cdr.detectChanges();
        this.pageGrid.api.hideOverlay();
      });

    });
  }

  initializeGrid() {
    this.columnDefs = [
      {
        width: 30,
        cellRenderer: FontAwesomeIconLinkRendererComponent,
        cellRendererParams: { isSpan: true, fontawesomeIconName: 'trash' }
      },
      {
        width: 30,
        valueGetter: function (params: any) {
          return params.data.CustomPageVanityUrl;
        },
        cellRenderer: FontAwesomeIconLinkRendererComponent,
        cellRendererParams: { 
          inRouterLink: '/custom-pages/edit-properties/',
          fontawesomeIconName: 'edit'
        }
      },
      {
        headerName: 'Page Name', valueGetter: function (params: any) {
          return { LinkValue: params.data.CustomPageVanityUrl, LinkDisplay: params.data.CustomPageDisplayName };
        },
        cellRenderer: LinkRendererComponent,
        cellRendererParams: { inRouterLink: '/custom-pages/' },
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
        filter: true,
        filterValueGetter: function (params: any) {
          return params.data.CustomPageDisplayName;
        },
        sortable: true
      },
      { headerName: 'Menu', field: 'MenuItem.MenuItemDisplayName',
        filter: CustomDropdownFilterComponent,
        filterParams: {
          field: 'MenuItem.MenuItemDisplayName'
        },
        sortable: true
      },
      { headerName: 'Has Content', field: 'IsEmptyContent', valueGetter: function (params) {
        return params.data.IsEmptyContent ? 'No' : 'Yes'; },
      filter: CustomDropdownFilterComponent,
      filterParams: {
        field: 'IsEmptyContent'
      },
      sortable: true
      },
      { 
        headerName: 'Viewable By', field: 'ViewableRoles', valueGetter: function (params) {
          return params.data.ViewableRoles
            .map(x => x.RoleDisplayName)
            .join(', ');
        },
        filter: CustomDropdownFilterComponent,
        filterParams: {
          field: 'RoleDisplayName'
        },
        sortable: true
      }
    ]; 

    this.columnDefs.forEach(x => {
      x.resizable = true;
    });
  }

  public onFirstDataRendered(params): void {
    this.gridApi = params.api;
    this.gridApi.sizeColumnsToFit();
    this.updateGridData();
  }

  public updateGridData(): void {
    this.customPageService.customPagesWithRolesGet().subscribe(customPagesWithRoles => {
      this.rowData = customPagesWithRoles;
      this.cdr.detectChanges();
    });
    this.pageGrid.api.hideOverlay();
  }

  public onCellClicked(event: any): void {
    if (event.column.colId == '0') {
      this.customPageIDToRemove = event.data.CustomPageID;
      this.launchModal(this.deleteEntity, 'deleteAnnouncementEntity')
    }
  }

  public launchModal(modalContent: any, modalTitle: string): void {
    this.modalReference = this.modalService.open(modalContent, { ariaLabelledBy: modalTitle, beforeDismiss: () => this.checkIfSubmitting(), backdrop: 'static', keyboard: false });
    this.modalReference.result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed`;
    });
  }
  
  public checkIfSubmitting(): boolean {
    return !this.isPerformingAction;
  }

  public removePageByID(): void {
    this.isPerformingAction = true;
    this.customPageService.customPagesCustomPageIDDelete(this.customPageIDToRemove).subscribe(() => {
      this.modalReference.close();
      this.isPerformingAction = false;
      this.authenticationService.refreshUserInfo(this.currentUser);
      this.alertService.pushAlert(new Alert(`Custom page successfully deleted`, AlertContext.Success, true));
      this.updateGridData();
    }, error => {
      this.modalReference.close();
      this.isPerformingAction = false;
      this.alertService.pushAlert(new Alert(`There was an error deleting the page. Please try again`, AlertContext.Danger, true));
    })
  }

  ngOnDestroy(): void {
    this.cdr.detach();
  }
}
