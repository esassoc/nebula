import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { forkJoin } from 'rxjs';
import { WatershedDto, WatershedService } from 'src/app/shared/generated';

@Component({
    selector: 'template-watershed-detail',
    templateUrl: './watershed-detail.component.html',
    styleUrls: ['./watershed-detail.component.scss'],
    standalone: false
})
export class WatershedDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  private authenticationService = inject(AuthenticationService);

  public watershed = signal<WatershedDto>(null);

  public today: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private watershedService: WatershedService
  ) {
    // force route reload whenever params change;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit() {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const id = parseInt(this.route.snapshot.paramMap.get('id'));
      if (id) {
        forkJoin(
          this.watershedService.watershedsWatershedIDGet(id),
        ).subscribe(([watershed]) => {
          this.watershed.set(watershed instanceof Array
            ? null
            : watershed as WatershedDto);
        });
      }
    });
  }

  public getSelectedWatershedIDs(): Array<number> {
    // Signal initialises to null rather than undefined, so check for a value
    // rather than reproducing the old `!== undefined` test.
    return this.watershed() ? [this.watershed().WatershedID] : [];
  }
}