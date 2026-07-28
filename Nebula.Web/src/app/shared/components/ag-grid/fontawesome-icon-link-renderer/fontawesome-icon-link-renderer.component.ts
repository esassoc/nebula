import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';

@Component({
    selector: 'nebula-fontawesome-icon-link-renderer',
    templateUrl: './fontawesome-icon-link-renderer.component.html',
    styleUrls: ['./fontawesome-icon-link-renderer.component.scss'],
    standalone: false
})
export class FontAwesomeIconLinkRendererComponent implements AgRendererComponent {
  params: any;    

  agInit(params: any): void {
    if(params.value === null)
    {
      params = { value: '' }
    }
    else
    {
      this.params = params;
    }
  }

  refresh(params: any): boolean {
    return false;
  }    
}