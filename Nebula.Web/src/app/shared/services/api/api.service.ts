import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError as _throw } from 'rxjs';
import { BusyService } from '../busy/busy.service';
import { AlertService } from '../alert.service';
import { Alert } from 'src/app/shared/models/alert';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private busyService: BusyService,
    private alertService: AlertService,
    private router: Router,) {
  }

  public handleResponse(response: any): Observable<any> {
    this.busyService.setBusy(false);
    return response;
  }

  public handleError(error: any, supressErrorMessage = false, clearBusyGlobally = true): Observable<any> {
    if (clearBusyGlobally) {
      this.busyService.setBusy(false);
    }

    if (!supressErrorMessage) {
      if (error && (error.status === 401)) {
        this.alertService.pushAlert(new Alert('Access token expired...'));
      } else if (error && (error.status === 403)) {
        this.alertService.pushNotFoundUnauthorizedAlert();
        this.router.navigate(['/']);
      } else if (error.error && typeof error.error === 'string') {
        this.alertService.pushNotFoundUnauthorizedAlert();
        this.alertService.pushAlert(new Alert(error.error));
      } else if (error.error && error.status === 404) {
        // let the caller handle not found appropriate to whatever it was doing
      } else if (error.error && !(error.error instanceof ProgressEvent)) {
        for (const key of Object.keys(error.error)) {
          // FIXME: will break if errror.error[key] is not a string[]
          const newLocal = new Alert((error.error[key] as string[]).map((fe: string) => { return key + ': ' + fe; }).join(','));
          this.alertService.pushAlert(newLocal);
        }
      } else {
        this.alertService.pushAlert(new Alert('Oops! Something went wrong and we couldn\'t complete the action...'));
      }
    }

    return _throw(error);
  }
}
