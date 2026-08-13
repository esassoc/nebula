/**
 * This file includes polyfills needed by Angular and is loaded before the app.
 * You can add your own extra polyfills to this file.
 *
 * This file is divided into 2 sections:
 *   1. Browser polyfills. These are applied before loading ZoneJS and are sorted by browsers.
 *   2. Application imports. Files imported after ZoneJS that should be loaded before your main
 *      file.
 *
 * The current setup is for so-called "evergreen" browsers; the last versions of browsers that
 * automatically update themselves. This includes Safari >= 10, Chrome >= 55 (including Opera),
 * Edge >= 13 on the desktop, and iOS 10 and Chrome on mobile.
 *
 * Learn more in https://angular.io/guide/browser-support
 */

/***************************************************************************************************
 * BROWSER POLYFILLS
 */

/***************************************************************************************************
 * zone.js is intentionally absent. The app bootstraps with
 * provideZonelessChangeDetection(), so change detection is driven by signals
 * and explicit notification rather than by zone.js monkey-patching async APIs.
 * The CLI's zone-flags guidance that used to live here no longer applies.
 */
import '@angular/localize/init';

/***************************************************************************************************
 * APPLICATION IMPORTS
 */
