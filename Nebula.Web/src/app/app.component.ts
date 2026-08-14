import { Component, Inject, DOCUMENT, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouteConfigLoadStart, RouteConfigLoadEnd, NavigationEnd } from '@angular/router';
import { BusyService } from './shared/services';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private busyService: BusyService,
    private titleService: Title,
    @Inject(DOCUMENT) private _document: HTMLDocument
  ) { }

  ngOnInit() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event: any) => {
      if (event instanceof RouteConfigLoadStart) { // lazy loaded route started
        this.busyService.setBusy(true);
      } else if (event instanceof RouteConfigLoadEnd) { // lazy loaded route ended
        this.busyService.setBusy(false);
      } else if (event instanceof NavigationEnd) {
        window.scrollTo(0, 0);
      }
    });

    this.titleService.setTitle('Smart Watershed Network Platform')
    this.setAppFavicon();
  }

  setAppFavicon() {
    this._document.getElementById('appFavicon').setAttribute('href', 'assets/main/favicons/favicon.ico');
  }
}
