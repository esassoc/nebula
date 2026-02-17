import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

@Component({
    selector: 'nebula-watershed-detail-popup',
    templateUrl: './watershed-detail-popup.component.html',
    styleUrls: ['./watershed-detail-popup.component.scss'],
    standalone: false
})
export class WatershedDetailPopupComponent implements OnInit {
  constructor(private cdr: ChangeDetectorRef) { }

  public feature : any;
  
  ngOnInit() {
  }

  public detectChanges() : void{
    this.cdr.detectChanges();
  } 
}
