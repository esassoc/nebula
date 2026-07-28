import { Component, OnInit, ChangeDetectorRef, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { forkJoin } from 'rxjs';
import { UserDto, WatershedDto, WatershedService } from 'src/app/shared/generated';

@Component({
    selector: 'template-watershed-detail',
    templateUrl: './watershed-detail.component.html',
    styleUrls: ['./watershed-detail.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class WatershedDetailComponent implements OnInit, OnDestroy {
  
  private currentUser: UserDto;

  public watershed: WatershedDto;

  public today: Date = new Date();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private watershedService: WatershedService,
    private authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef
  ) {
    // force route reload whenever params change;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
  }

  ngOnInit() {
    this.authenticationService.getCurrentUser().subscribe(currentUser => {
      this.currentUser = currentUser;

      const id = parseInt(this.route.snapshot.paramMap.get('id'));
      if (id) {
        forkJoin(
          this.watershedService.watershedsWatershedIDGet(id),
        ).subscribe(([watershed]) => {
          this.watershed = watershed instanceof Array
            ? null
            : watershed as WatershedDto;
        });
      }
    });
  }

  ngOnDestroy() {
    
    
    this.cdr.detach();
  }

  public getSelectedWatershedIDs(): Array<number> {
    return this.watershed !== undefined ? [this.watershed.WatershedID] : [];
  }
}