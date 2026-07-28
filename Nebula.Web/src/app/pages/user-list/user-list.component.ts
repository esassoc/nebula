import { Component, OnInit, ChangeDetectorRef, OnDestroy, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ColDef } from 'ag-grid-community';
import { LinkRendererComponent } from 'src/app/shared/components/ag-grid/link-renderer/link-renderer.component';
import { DecimalPipe } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import { UtilityFunctionsService } from 'src/app/services/utility-functions.service';
import { RoleEnum } from 'src/app/shared/generated/enum/role-enum';
import { UserDto, UserService } from 'src/app/shared/generated';

declare let $: any;

@Component({
  selector: 'nebula-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class UserListComponent implements OnInit, OnDestroy {
  @ViewChild('usersGrid') usersGrid: AgGridAngular;
  @ViewChild('unassignedUsersGrid') unassignedUsersGrid: AgGridAngular;

  private currentUser: UserDto;

  public rowData = [];
  columnDefs: ColDef[];
  columnDefsUnassigned: ColDef[];
  users: UserDto[];
  unassignedUsers: UserDto[];

  constructor(
    private cdr: ChangeDetectorRef,
    private authenticationService: AuthenticationService,
    private utilityFunctionsService: UtilityFunctionsService,
    private userService: UserService,
    private decimalPipe: DecimalPipe
  ) { }

  ngOnInit() {
    this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;
      this.usersGrid?.api.showLoadingOverlay();
      this.userService.usersGet().subscribe(users => {
        this.rowData = users;
        this.users = users;
        this.unassignedUsers = users.filter(u => { return u.Role.RoleID === RoleEnum.Unassigned });

        this.cdr.detectChanges();
      });
      const _decimalPipe = this.decimalPipe;

      this.columnDefs = [
        {
          headerName: 'Name', valueGetter: function (params: any) {
            return { LinkValue: params.data.UserID, LinkDisplay: params.data.FullName };
          }, cellRenderer: LinkRendererComponent,
          cellRendererParams: { inRouterLink: '/users/' },
          filterValueGetter: function (params: any) {
            return params.data.FullName;
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
          sortable: true, filter: true, width: 170
        },
        { headerName: 'Email', field: 'Email', sortable: true, filter: true },
        { headerName: 'Role', field: 'Role.RoleDisplayName', sortable: true, filter: true, width: 100 },
        { headerName: 'Receives System Communications?', field: 'ReceiveSupportEmails', valueGetter: function (params) { return params.data.ReceiveSupportEmails ? 'Yes' : 'No'; }, sortable: true, filter: true, width: 250 },
      ];

      this.columnDefs.forEach(x => {
        x.resizable = true;
      });
    });
  }


  ngOnDestroy() {


    this.cdr.detach();
  }

  public exportToCsv() {
    // we need to grab all columns except the first one (trash icon)
    const columnsKeys = this.usersGrid.api.getAllDisplayedColumns();
    const columnIds: Array<any> = [];
    columnsKeys.forEach(keys => {
      const columnName: string = keys.getColId();
      columnIds.push(columnName);
    });
    columnIds.splice(0, 1);
    this.utilityFunctionsService.exportGridToCsv(this.usersGrid, 'users.csv', columnIds);
  }
}
