import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { SiteVariable } from '../../models/site-variable';

@Component({
    selector: 'selected-data-card',
    templateUrl: './selected-data-card.component.html',
    styleUrls: ['./selected-data-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SelectedDataCardComponent implements OnInit {

  @Input() 
  public selectedVariables: SiteVariable[];
  @Input()
  public disableActions: boolean  = false;
  @Input()
  public headerText: string = 'Selected Data';
  @Output()
  public selectedVariablesChange = new EventEmitter<SiteVariable[]>();
  @Output()
  public singleVariableRemoved = new EventEmitter<number>();
  @Output()
  public allVariablesCleared = new EventEmitter();
  @Output()
  public selectStationOnMap = new EventEmitter<string>();

  constructor() { }

  ngOnInit(): void {
  }

  public emitSelectStationOnMap(variable : SiteVariable) {
    this.selectStationOnMap.emit(variable.station);
  }

  public removeVariableFromSelection(index: number): void {
    this.selectedVariables.splice(index, 1);
    //Need to spread here to adequately trigger change detection
    this.selectedVariablesChange.emit([...this.selectedVariables]);
    this.singleVariableRemoved.emit(index);
  }

  public clearAllVariables(): void {
    this.selectedVariables = [];
    this.selectedVariablesChange.emit(this.selectedVariables);
    this.allVariablesCleared.emit();
  }

}
