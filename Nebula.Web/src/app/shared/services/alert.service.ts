import { Injectable, signal } from '@angular/core';
import { Alert } from '../models/alert';
import { AlertContext } from '../models/enums/alert-context.enum';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  // Signal rather than BehaviorSubject: under zoneless change detection a
  // subscribe-and-assign does not schedule a re-render, but a signal read in a
  // template does. Updates are immutable -- the previous implementation pushed
  // into the same array and re-emitted the same reference, which a signal would
  // not treat as a change.
  private readonly alertsSignal = signal<Alert[]>([]);
  public readonly alerts = this.alertsSignal.asReadonly();

  pushAlert(alert: Alert): void {
    if (alert.uniqueCode && this.alertsSignal().some(x => x.uniqueCode === alert.uniqueCode)) {
      return; // don't push a duplicate alert if it has a unique token.
    }

    this.alertsSignal.update(alerts => [...alerts, alert]);
  }

  removeAlert(alert: Alert): void {
    this.alertsSignal.update(alerts => alerts.filter(x => x !== alert));
  }

  clearAlerts(): void {
    this.alertsSignal.set([]);
  }

  pushNotFoundUnauthorizedAlert() {
    this.pushAlert(new Alert('The page you are trying to access was not found, or you do not have permission to view it.', AlertContext.Info, true, AlertService.NOT_FOUND_UNAUTHORIZED));
  }

  public static NOT_FOUND_UNAUTHORIZED = 'NotFoundUnauthorized';
  public static USERS_AWAITING_CONFIGURATION = 'UsersAwaitingConfiguration';
}
