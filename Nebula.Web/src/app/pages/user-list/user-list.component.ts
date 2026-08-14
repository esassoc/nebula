import { Component, OnInit, ViewChild, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  standalone: false
})
export class UserListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  @ViewChild('usersGrid') usersGrid: AgGridAngular;
  @ViewChild('unassignedUsersGrid') unassignedUsersGrid: AgGridAngular;

  private currentUser: UserDto;

  // Signals rather than plain fields: these are assigned from HTTP callbacks,
  // which under zoneless change detection no longer schedule a re-render on
  // their own. Reading them in the template is what marks the view dirty.
  public rowData = signal<UserDto[]>([]);
  public columnDefs = signal<ColDef[]>([]);
  public users = signal<UserDto[]>(null);
  public unassignedUsers = signal<UserDto[]>([]);

  constructor(
    private authenticationService: AuthenticationService,
    private utilityFunctionsService: UtilityFunctionsService,
    private userService: UserService,
    private decimalPipe: DecimalPipe
  ) { }

  ngOnInit() {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(currentUser => {
      this.currentUser = currentUser;
      this.usersGrid?.api.showLoadingOverlay();
      this.userService.usersGet().subscribe(users => {
        this.rowData.set(users);
        this.users.set(users);
        this.unassignedUsers.set(users.filter(u => { return u.Role.RoleID === RoleEnum.Unassigned }));
      });
      const _decimalPipe = this.decimalPipe;

      const columnDefs: ColDef[] = [
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

      columnDefs.forEach(x => {
        x.resizable = true;
      });
      this.columnDefs.set(columnDefs);
    });
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
