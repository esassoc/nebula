import { Injectable } from '@angular/core';
import { from } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';

declare let window: any;

@Injectable()
export class AppInitService {

  constructor() {
    // Register AG Grid modules
    ModuleRegistry.registerModules([AllCommunityModule]);
  }

  // This is the method you want to call at bootstrap
  // Important: It should return a Promise
  public init() {
    return from(
      fetch('assets/config.json').then(function(response) {
        return response.json();
      })
    ).pipe(
      map((config) => {
        config.keystoneAuthConfiguration.redirectUri = window.location.origin + config.keystoneAuthConfiguration.redirectUriRelative;
        config.keystoneAuthConfiguration.postLogoutRedirectUri = window.location.origin + config.keystoneAuthConfiguration.postLogoutRedirectUri
        window.config = config;
        return;
      })).toPromise();
  }
}