import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'not-found',
    templateUrl: './not-found.component.html',
    styleUrls: ['./not-found.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NotFoundComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
