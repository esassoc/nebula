import { Component, signal } from '@angular/core';

@Component({
    selector: 'nebula-watershed-detail-popup',
    templateUrl: './watershed-detail-popup.component.html',
    styleUrls: ['./watershed-detail-popup.component.scss'],
    standalone: false
})
export class WatershedDetailPopupComponent {
  // A signal because this component is created imperatively by
  // CustomCompileService and `feature` is assigned from outside Angular (a
  // Leaflet popup callback). Setting a signal schedules the render itself,
  // which is why the old public detectChanges() escape hatch is gone.
  public feature = signal<any>(null);
}
