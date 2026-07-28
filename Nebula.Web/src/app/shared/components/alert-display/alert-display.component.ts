import { Component, OnDestroy, inject } from '@angular/core';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert';

@Component({
    selector: 'app-alert-display',
    templateUrl: './alert-display.component.html',
    styleUrls: ['./alert-display.component.css'],
    standalone: false
})
export class AlertDisplayComponent implements OnDestroy {

  private alertService = inject(AlertService);

  // Read straight off the service signal: no subscription to manage and no
  // manual detectChanges(), which is what the zone-based version needed.
  public alerts = this.alertService.alerts;

  public ngOnDestroy(): void {
    this.alertService.clearAlerts();
  }

  public closeAlert(alert: Alert) {
    this.alertService.removeAlert(alert);
  }

}
