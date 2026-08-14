// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// No 'zone.js/testing' import: the app bootstraps with
// provideZonelessChangeDetection(), so the test environment matches it.
// Consequence for specs: fakeAsync/tick/async are unavailable under zoneless --
// use `await fixture.whenStable()` instead.
import { provideZonelessChangeDetection } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false }
  }
);

getTestBed().configureTestingModule({
  providers: [provideZonelessChangeDetection()]
});
