import { Injectable, ApplicationRef, EnvironmentInjector, createComponent } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CustomCompileService {

  private appRef: ApplicationRef;

  constructor(
    private environmentInjector: EnvironmentInjector
  ) { }

  configure(appRef) {
    this.appRef = appRef;
  }

  compile(component, onAttach) {
    // Angular 22 removed ComponentFactoryResolver/resolveComponentFactory.
    // createComponent() is the supported equivalent: with no hostElement it
    // creates a detached host element, which is what the old
    // compFactory.create(injector) produced. Behaviour is unchanged -- the
    // component is attached to the ApplicationRef so it takes part in change
    // detection, then its DOM node is handed back for Leaflet to put in a popup.
    const compRef = createComponent(component, {
      environmentInjector: this.environmentInjector
    });

    if (onAttach) {
      onAttach(compRef);
    }

    this.appRef.attachView(compRef.hostView);
    compRef.onDestroy(() => this.appRef.detachView(compRef.hostView));

    const div = document.createElement('div');
    div.appendChild(compRef.location.nativeElement);
    return div;
  }
}
