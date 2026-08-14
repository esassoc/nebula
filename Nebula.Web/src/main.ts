import { enableProdMode, provideZonelessChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Load config BEFORE bootstrapping
fetch('/assets/config.json', { credentials: 'include' })
  .then(async (res) => {
    if (!res.ok) throw new Error(`Preload failed: ${res.status}`);
    const cfg = await res.json();
    (window as any).config = cfg;
  })
  .catch((err) => {
    console.error(err);
    // Optionally set a fallback config here
  })
  .then(() => {
    // Bootstrap AFTER config is loaded
    platformBrowserDynamic()
      .bootstrapModule(AppModule, { applicationProviders: [provideZonelessChangeDetection()], })
      .catch((err) => console.error(err));
  });
