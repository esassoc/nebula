import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SiteVariable } from '../../models/site-variable';

@Component({
    selector: 'selected-data-card',
    templateUrl: './selected-data-card.component.html',
    styleUrls: ['./selected-data-card.component.scss'],
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

  // Neither of these mutates this.selectedVariables. It is an @Input, and
  // splicing it edited the parent's array in place -- invisible to a signal, so
  // the parent never re-rendered and its predicates went stale. The parent owns
  // the list and updates it from these events; the new value comes back through
  // the input.
  public removeVariableFromSelection(index: number): void {
    this.selectedVariablesChange.emit(this.selectedVariables.filter((_, i) => i !== index));
    this.singleVariableRemoved.emit(index);
  }

  public clearAllVariables(): void {
    this.selectedVariablesChange.emit([]);
    this.allVariablesCleared.emit();
  }

}
