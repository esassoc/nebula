import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';

@Component({
    selector: 'nebula-link-renderer',
    templateUrl: './link-renderer.component.html',
    styleUrls: ['./link-renderer.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

export class LinkRendererComponent implements AgRendererComponent {
  params: any;    

  agInit(params: any): void {
    if(params.value === null)
    {
      params = { value: { LinkDisplay: '', LinkValue: ''}, inRouterLink: ''}
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