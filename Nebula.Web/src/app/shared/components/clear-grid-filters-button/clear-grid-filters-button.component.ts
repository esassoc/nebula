import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AgGridAngular } from 'ag-grid-angular';

@Component({
    selector: 'nebula-clear-grid-filters-button',
    templateUrl: './clear-grid-filters-button.component.html',
    styleUrls: ['./clear-grid-filters-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ClearGridFiltersButtonComponent {
  @Input() grid: AgGridAngular;

  public clearFilters() {
    this.grid.api.setFilterModel(null);
  }  

  public isFilterActive() {
    if (this.grid && this.grid.api) {
      return this.grid.api.isAnyFilterPresent();
    }
  }
}
