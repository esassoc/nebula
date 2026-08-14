import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { NgbPopover } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'link-to-analysis',
    templateUrl: './link-to-analysis.component.html',
    styleUrls: ['./link-to-analysis.component.scss'],
    standalone: false
})
export class LinkToAnalysisComponent implements OnInit {

  @ViewChild
  ('p') public popover: NgbPopover;

  @Input()
  public linkText: string;
  
  constructor(private elem: ElementRef) { }

  ngOnInit(): void {
  }

  openPopoverAndSelectText() {
    if (this.popover.isOpen()) {
      this.popover.close();
      return;
    }

    this.popover.open();
    //MP 9/27/21 Seems like the link being a property value is causing it to 
    //not recognize that there is text to select right away. So give a small delay and then
    //highlight the text.
    setTimeout(() => this.selectPopoverText(), 1);
  }

  selectPopoverText() {
    if (!this.popover.isOpen()) {
      return;
    }

    // Scoped to this component. The popover used to be appended to body, so
    // this had to search the whole document for #linkText -- which picks the
    // first match, not necessarily this component's, and every instance of
    // this component uses that same id.
    this.elem.nativeElement.querySelector('#linkText')?.select();
  }

}
