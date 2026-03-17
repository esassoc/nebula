import { Component, forwardRef,ViewEncapsulation,Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'ng-select-custom',
    templateUrl: './ng-select-custom.component.html',
    styleUrls: ['./ng-select-custom.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => NgSelectCustomComponent),
            multi: true
        }
    ],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class NgSelectCustomComponent {

  @Input() items: any;
  @Input() bindLabel: string;
  @Input() bindValue: string;
  @Input() placeholder: string;
  @Input() labelForId: string;
  @Input() control: any = null;
  @Input() multiple: boolean = false;
  @Input() numSelectedItemsToShow: number = 1;

  selectAll() : void {
    if (this.control == null || this.items == null || this.bindValue == null) {
      return;
    }

    this.control.patchValue(this.items.map(x => x[this.bindValue]));
  }

  clearAll() : void {
    if (this.control == null || this.items == null || this.bindValue == null) {
      return;
    }

    this.control.patchValue(null);
  }

}
