import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { LyraService } from 'src/app/services/lyra.service';
import { StationSelectCardComponent } from 'src/app/shared/components/station-select-card/station-select-card.component';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { SiteFilterEnum } from 'src/app/shared/models/enums/site-filter.enum';
import { HydstraWeatherCondition } from 'src/app/shared/models/hydstra/hydstra-weather-condition';
import { SiteVariable } from 'src/app/shared/models/site-variable';
import { AlertService } from 'src/app/shared/services/alert.service';
import DateRangeHelpers from 'src/app/shared/helpers/date-range-helpers';
import { DateTime } from 'luxon';
import { CustomRichTextTypeEnum } from 'src/app/shared/generated/enum/custom-rich-text-type-enum';
import { UserDto } from 'src/app/shared/generated';

declare let $: any;
declare let vegaEmbed: any;

@Component({
    selector: 'nebula-diversion-scenario',
    templateUrl: './diversion-scenario.component.html',
    styleUrls: ['./diversion-scenario.component.scss'],
    standalone: false
})
export class DiversionScenarioComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  public currentUser: UserDto;

  @ViewChild('selectedDataCardRef') selectedDataCardRef: ElementRef;
  @ViewChild('stationSelect') stationSelect: StationSelectCardComponent;

  public mapID: string = 'DiversionScenarioStationSelectMap';

  public richTextTypeID = CustomRichTextTypeEnum.DiversionScenario;
  public defaultSelectedMapFilter = SiteFilterEnum.HasDischarge;

  public vegaSpec = signal<Object>(null);

  public hydstraWeatherConditions: HydstraWeatherCondition[] = HydstraWeatherCondition.all();

  public selectedSiteProperties: any;
  public selectedSiteAvailableVariables = signal<SiteVariable[]>([]);
  public selectedSiteStation = signal<string>(null);
  public selectedSiteName = signal<string>(null);
  public selectedVariables = signal<SiteVariable[]>([]);

  public errorOccurred = signal(false);
  public errorMessage = signal<string>(null);
  public gettingTimeSeriesData = signal(false);
  public rainfallStations = signal<any>(null);
  public currentlyDisplayingRequestDto: any;
  public downloadingChartData = signal(false);
  public lyraMessages = signal<Alert[]>([]);

  public variableNamesAllowedToAddToScenario = ['Discharge'];

  public monthData = [
    { id: 1, display: 'January' },
    { id: 2, display: 'February' },
    { id: 3, display: 'March' },
    { id: 4, display: 'April' },
    { id: 5, display: 'May' },
    { id: 6, display: 'June' },
    { id: 7, display: 'July' },
    { id: 8, display: 'August' },
    { id: 9, display: 'September' },
    { id: 10, display: 'October' },
    { id: 11, display: 'November' },
    { id: 12, display: 'December' }
  ]

  public weekdayData = [
    { id: 6, display: 'Sunday' },
    { id: 0, display: 'Monday' },
    { id: 1, display: 'Tuesday' },
    { id: 2, display: 'Wednesday' },
    { id: 3, display: 'Thursday' },
    { id: 4, display: 'Friday' },
    { id: 5, display: 'Saturday' }
  ]

  public hourData = [
    { id: 0, display: '12 AM' },
    { id: 1, display: '1 AM' },
    { id: 2, display: '2 AM' },
    { id: 3, display: '3 AM' },
    { id: 4, display: '4 AM' },
    { id: 5, display: '5 AM' },
    { id: 6, display: '6 AM' },
    { id: 7, display: '7 AM' },
    { id: 8, display: '8 AM' },
    { id: 9, display: '9 AM' },
    { id: 10, display: '10 AM' },
    { id: 11, display: '11 AM' },
    { id: 12, display: '12 PM' },
    { id: 13, display: '1 PM' },
    { id: 14, display: '2 PM' },
    { id: 15, display: '3 PM' },
    { id: 16, display: '4 PM' },
    { id: 17, display: '5 PM' },
    { id: 18, display: '6 PM' },
    { id: 19, display: '7 PM' },
    { id: 20, display: '8 PM' },
    { id: 21, display: '9 PM' },
    { id: 22, display: '10 PM' },
    { id: 23, display: '11 PM' },
  ]

  public currentDate = DateTime.utc();
  public startDate = this.currentDate.minus({months:3});
  public timeSeriesForm = new UntypedFormGroup({
    start_date: new UntypedFormControl({ year: this.startDate.year, month: this.startDate.month, day: this.startDate.day }, [Validators.required]),
    end_date: new UntypedFormControl({ year: this.currentDate.year, month: this.currentDate.month, day: this.currentDate.day }, [Validators.required]),
    site: new UntypedFormControl(null, [Validators.required]),
    diversion_rate_cfs: new UntypedFormControl(0, [Validators.required]),
    storage_max_depth_ft: new UntypedFormControl(0, [Validators.required]),
    storage_initial_depth_ft: new UntypedFormControl(0, [Validators.required]),
    storage_area_sqft: new UntypedFormControl(0, [Validators.required]),
    infiltration_rate_inhr: new UntypedFormControl(0, [Validators.required]),
    rainfall_event_shutdown: new UntypedFormControl(true, [Validators.required]),
    rainfall_event_depth_threshold: new UntypedFormControl(0.1, [Validators.required]),
    event_seperation_hrs: new UntypedFormControl(6, [Validators.required]),
    after_rain_delay_hrs: new UntypedFormControl(72, [Validators.required]),
    nearest_rainfall_station: new UntypedFormControl(null, [Validators.required]),
    diversion_months_active: new UntypedFormControl(this.monthData.map(x => x.id), [Validators.required]),
    diversion_days_active: new UntypedFormControl(this.weekdayData.map(x => x.id), [Validators.required]),
    diversion_hours_active: new UntypedFormControl(this.hourData.map(x => x.id), [Validators.required]),
  });
  public timeSeriesFormDefault = this.timeSeriesForm.value;
  currentlyDisplayingRequestLinkText: string;
  mapReady: boolean;
  summaryTableColumns: string[] = [];
  summaryTableRows: any[] = [];


  constructor(
    private cdr: ChangeDetectorRef,
    private lyraService: LyraService,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {
  }

  ngOnInit() {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(currentUser => {
      this.currentUser = currentUser;
      this.lyraService.getSiteLocationGeoJson().subscribe(result => {
        this.rainfallStations.set(result.features.filter(x => x.properties.has_rainfall).sort((x, y) => {
          if (x.properties.stname > y.properties.stname) {
            return 1;
          }

          if (x.properties.stname < y.properties.stname) {
            return -1;
          }

          return 0;
        }));

        if (this.mapReady) {
          this.populateFormFromURL();
        }
      });
      this.setupFormChangeListener();
    });
  }

  public onSubmit() {
    this.getTimeSeriesData();
  }

  public isActionBeingPerformed() {
    return this.gettingTimeSeriesData() || this.downloadingChartData()
  }

  public getTimeSeriesData() {
    if (!this.timeSeriesForm.valid) {
      Object.keys(this.timeSeriesForm.controls).forEach(field => {
        const control = this.timeSeriesForm.get(field);
        control.markAsTouched({ onlySelf: true });
      });
      return;
    }
    const swnTimeSeriesRequestDto =
    {
      start_date: this.getDateFromTimeSeriesFormDateObject('start_date'),
      end_date: this.getDateFromTimeSeriesFormDateObject('end_date'),
      site: this.timeSeriesForm.get('site').value,
      diversion_rate_cfs: this.timeSeriesForm.get('diversion_rate_cfs').value,
      storage_max_depth_ft: this.timeSeriesForm.get('storage_max_depth_ft').value,
      storage_initial_depth_ft: this.timeSeriesForm.get('storage_initial_depth_ft').value,
      storage_area_sqft: this.timeSeriesForm.get('storage_area_sqft').value,
      infiltration_rate_inhr: this.timeSeriesForm.get('infiltration_rate_inhr').value,
      rainfall_event_shutdown: this.timeSeriesForm.get('rainfall_event_shutdown').value,
      rainfall_event_depth_threshold: this.timeSeriesForm.get('rainfall_event_depth_threshold').value,
      event_seperation_hrs: this.timeSeriesForm.get('event_seperation_hrs').value,
      after_rain_delay_hrs: this.timeSeriesForm.get('after_rain_delay_hrs').value,
      nearest_rainfall_station: this.timeSeriesForm.get('nearest_rainfall_station').value,
      diversion_months_active: this.timeSeriesForm.get('diversion_months_active').value,
      diversion_days_active: this.timeSeriesForm.get('diversion_days_active').value,
      diversion_hours_active: this.timeSeriesForm.get('diversion_hours_active').value
    };
    this.gettingTimeSeriesData.set(true);
    this.errorOccurred.set(false);
    this.vegaSpec.set(null);
    this.currentlyDisplayingRequestDto = null;
    this.lyraMessages.set([]);
    this.timeSeriesForm.disable({emitEvent: false});
    this.lyraService.getDiversionScenarioPlot(swnTimeSeriesRequestDto).subscribe(result => {
      if (result.hasOwnProperty('data') && result.data.hasOwnProperty('spec')) {
        if (result.data.hasOwnProperty('messages') && result.data.messages.length > 0) {
          this.lyraMessages.update(m => [...m, ...result.data.messages.filter(x => x != '').map(x => new Alert(x, AlertContext.Warning, true))]);
        }
        this.vegaSpec.set(result.data.spec);
        vegaEmbed('#vis', this.vegaSpec());
        this.currentlyDisplayingRequestDto = swnTimeSeriesRequestDto;
        this.currentlyDisplayingRequestLinkText = `${window.location.origin}${window.location.pathname}?json=${JSON.stringify(this.currentlyDisplayingRequestDto)}`;
        if (result.data.hasOwnProperty('table')) {
          const tableSpec = result.data.table;
          this.summaryTableColumns = Object.keys(tableSpec.records[0]);
          this.summaryTableRows = tableSpec.records;
        }
      }
      else {
        this.errorOccurred.set(true);
        if (result.hasOwnProperty('msg')) {
          this.lyraMessages.update(m => [...m, new Alert(`There was an error with the entered query. Message: ${result.msg}`, AlertContext.Danger, true)]);
        }
      }
      this.gettingTimeSeriesData.set(false);
      this.timeSeriesForm.enable({emitEvent: false});
      this.cdr.detectChanges();
    },
    error => {
      if (error.hasOwnProperty('error') && error.error.hasOwnProperty('detail')) {
        for (const details of error.error.detail) {
          if (details.hasOwnProperty('msg')) {
            this.lyraMessages.update(m => [...m, new Alert(`There was an error with the entered query. Message: ${details.msg}`, AlertContext.Danger, true)]);
          }
        }
      }
      this.errorOccurred.set(true);
      this.gettingTimeSeriesData.set(false);
      this.timeSeriesForm.enable({emitEvent: false});
    });
  }

  public downloadChartData() {
    if (!this.currentlyDisplayingRequestDto) {
      return;
    }

    this.downloadingChartData.set(true);
    this.timeSeriesForm.disable({emitEvent: false});
    this.lyraService.downloadDiversionScenarioData(this.currentlyDisplayingRequestDto).subscribe(result => {
      let toAppendToResults = ''
      if (this.summaryTableColumns.length > 0 && this.summaryTableRows.length > 0) {
        toAppendToResults = 'Summary Table,\n';
        toAppendToResults += this.summaryTableColumns.join(',') + '\n';
        this.summaryTableRows.forEach(x => {
          this.summaryTableColumns.forEach(y => {
            let toAppend = x[y];
            if (toAppend.includes(',')) {
              toAppend = '"' + toAppend + '"';
            }
            toAppendToResults += toAppend + ',';
          })
          toAppendToResults += '\n';
        });
        toAppendToResults += '\nChart Data,\n';
      }
      const blob = new Blob([toAppendToResults, result], {
        type: 'text/csv'
      });

      //Create a fake object to trigger downloading the csv file that was returned
      const a: any = document.createElement('a');
      document.body.appendChild(a);

      a.style = 'display: none';
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      const date = new Date();
      a.download = `SWN_Diversion_Scenario_Data_Request_${date.getMonth() + 1}_${date.getDate()}_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.downloadingChartData.set(false);
      this.timeSeriesForm.enable({emitEvent: false});
    })
  }

  public siteSelectedAndVariablesFound(): boolean {
    return this.selectedSiteName() && this.selectedSiteAvailableVariables() != null && this.selectedSiteAvailableVariables().length > 0
  }

  public addVariableToSelection(variable: SiteVariable): void {
    this.selectedVariables.set([variable]);
    this.clampDateRangeToVariableRecord(variable);
    this.timeSeriesForm.patchValue({ site: variable.station });
    this.timeSeriesForm.patchValue({ nearest_rainfall_station: variable.nearestRainfallStationInfo.station});
    this.clearResults();
  }

  public removeVariableFromSelection(): void {
    // This page holds at most one variable, so removing means emptying it.
    // Previously selected-data-card spliced the array in place; now the parent
    // owns it.
    this.selectedVariables.set([]);
    this.timeSeriesForm.patchValue({ site: null });
    this.lyraMessages.set([]);
    this.clearResults();
  }

  public catchExtraSymbols(event: KeyboardEvent): void {
    if (event.code === 'KeyE' || event.code === 'Equal' || event.code === 'Minus' || event.code === 'Plus') {
      event.preventDefault();
    }
  }

  //#region Supporting functions

  public catchPastedSymbols(event: any): void {
    let val = event.clipboardData.getData('text/plain');
    if (val && (val.includes('+') || val.includes('-') || val.includes('e') || val.includes('E'))) {
      val = val.replace(/\+|\-|e|E/g, '');
      event.preventDefault();
    }
  }

  public formatDateForNgbDatepicker(date: Date): any {
    const dateToChange = new Date(date);
    return { year: dateToChange.getUTCFullYear(), month: dateToChange.getUTCMonth() + 1, day: dateToChange.getUTCDate() };
  }

  public scrollIntoView(el: ElementRef) {
    el.nativeElement.scrollIntoView(true);
  }

  public closeAlert(index: number) {
    this.lyraMessages.update(m => m.filter((_, i) => i !== index));
  }

  public clearResults() {
    this.vegaSpec.set(null);
    this.summaryTableColumns = [];
    this.summaryTableRows = [];
    this.currentlyDisplayingRequestDto = null;
    this.lyraMessages.set([]);
    this.errorOccurred.set(false);
  }

  //#endregion

  //#region Form Functionality

  get f() {
    return this.timeSeriesForm.controls;
  }

  public getDateFromTimeSeriesFormDateObject(formFieldName: string): string {
    const date = this.timeSeriesForm.get(formFieldName).value;
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  }

  public setupFormChangeListener() {
    this.timeSeriesForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
      this.clearResults();
    })
  }

  //#endregion

  //#region PopulateFromURL functionality

  public setMapReadyToTrueAndCheckIfWeCanPopulateFormFromURL() {
    this.mapReady = true;
    if (this.rainfallStations() != null) {
      this.populateFormFromURL();
    }
  }

  public populateFormFromURL() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params == null || params == undefined || !params.hasOwnProperty('json')) {
        return;
      }

      let queriedParams;

      try {
        queriedParams = JSON.parse(params.json);
      }
      catch (e) {
        this.alertService.pushAlert(new Alert(`There was an error parsing the URL. ${e}`, AlertContext.Danger, true));
        return;
      }
      

      //Don't bother if we don't have a site
      if (!queriedParams.hasOwnProperty('site')) {
        return;
      }

      const message = this.stationSelect.externalAddSiteVariableReturnMessageIfFailed(queriedParams.site, 'discharge');
      if (message != null && message != undefined) {
        this.alertService.pushAlert(new Alert(message, AlertContext.Danger, true));
        return;
      }

      if (queriedParams.start_date != null) {
        const start_date = new Date(queriedParams.start_date);
        this.timeSeriesForm.patchValue({start_date : { year: start_date.getUTCFullYear(), month: start_date.getUTCMonth() + 1, day: start_date.getUTCDate() }});
      }

      if (queriedParams.end_date != null) {
        const end_date = new Date(queriedParams.end_date);
        this.timeSeriesForm.patchValue({end_date : { year: end_date.getUTCFullYear(), month: end_date.getUTCMonth() + 1, day: end_date.getUTCDate() }});
      }

      const errorMessagesToDisplay = [];

      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'diversion_rate_cfs', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'storage_max_depth_ft', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'storage_initial_depth_ft', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'storage_area_sqft', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'infiltration_rate_inhr', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'rainfall_event_shutdown', (x => typeof x === 'boolean'), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'rainfall_event_depth_threshold', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'event_seperation_hrs', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'after_rain_delay_hrs', (x => typeof x === 'number' && !isNaN(x)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(queriedParams, 'nearest_rainfall_station', (x => this.rainfallStations().some(y => x == y.properties.station)), errorMessagesToDisplay)        
      this.updateFormWithValueIfProvidedAndSomePresentPopulateErrorIfNot(queriedParams, 'diversion_months_active', this.monthData, ((x, y) => x.some(z => z.id == y)), errorMessagesToDisplay);
      this.updateFormWithValueIfProvidedAndSomePresentPopulateErrorIfNot(queriedParams, 'diversion_days_active', this.weekdayData, ((x, y) => x.some(z => z.id == y)), errorMessagesToDisplay);
      this.updateFormWithValueIfProvidedAndSomePresentPopulateErrorIfNot(queriedParams, 'diversion_hours_active', this.hourData, ((x, y) => x.some(z => z.id == y)), errorMessagesToDisplay);

      this.lyraMessages.set(errorMessagesToDisplay);
      this.cdr.detectChanges();
      this.scrollIntoView(this.selectedDataCardRef);
    })
  }

  public updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(jsonObject : any, key : string, validityFunction : any, errors : any) {
    const value = jsonObject[key];
    const startOfString = jsonObject.hasOwnProperty('site') ? `Station with ID:${jsonObject.site}` : 'Request';
    if (value == null || value == undefined) {
      errors.push(new Alert(`${startOfString} did not provide key:${key}. Will use default.`, AlertContext.Warning, true));
      return;
    }
    
    if (!validityFunction(value)) {
      errors.push(new Alert(`${startOfString} provided an invalid value for key:${key}. Will use default. Invalid value was:${value}`, AlertContext.Warning, true));
      return;
    }

    this.timeSeriesForm.patchValue({[key] : value});
  }

  public updateFormWithValueIfProvidedAndSomePresentPopulateErrorIfNot(jsonObject : any, key : string, listToCompare: any, comparisonFunction: any, errors : any) {
    const value = jsonObject[key];
    const startOfString = jsonObject.hasOwnProperty('site') ? `Station with ID:${jsonObject.site}` : 'Request';
    if (value == null || value == undefined) {
      errors.push(new Alert(`${startOfString} did not provide key:${key}. Will use default.`, AlertContext.Warning, true));
      return;
    }

    const presentValues = value.filter(x => comparisonFunction(listToCompare, x)).map(x => x);
    
    if (presentValues.length != value.length) {
      if (presentValues.length == 0) {
        errors.push(new Alert(`${startOfString} provided invalid values for key:${key}. Will use default. Invalid values were:${value.join(', ')}`, AlertContext.Warning, true));
        return;
      }
      errors.push(new Alert(`${startOfString} provided some invalid values for key:${key}. Will use only valid values. Invalid values were:${value.filter(x => !comparisonFunction(listToCompare, x)).map(x => x).join(', ')}`, AlertContext.Warning, true));
    }

    this.timeSeriesForm.patchValue({[key] : presentValues});
  }

  //#endregion

  public showOnMapForStation(station : string) {
    this.stationSelect.selectStationByStation(station);
  }

  public getSummaryRowDataForColumn(row:any, column:string ): string {
    if (!row.hasOwnProperty(column)) {
      return '';
    }

    return row[column];
  }

  /**
   * Keeps the requested window inside the record for the variable just added.
   * Lyra 500s on a window containing no data, and that crash bypasses its CORS
   * middleware, so the browser cannot read the reason -- the page would just
   * fail silently. The default window is the last three months, which is
   * entirely after the end of the record for any station whose data lags.
   */
  private clampDateRangeToVariableRecord(variable: SiteVariable): void {
    if (!variable || !variable.periodStart || !variable.periodEnd) {
      return;
    }

    const clamped = DateRangeHelpers.clampToAvailableRange(
      this.getDateFromTimeSeriesFormDateObject('start_date'),
      this.getDateFromTimeSeriesFormDateObject('end_date'),
      variable.periodStart,
      variable.periodEnd);

    if (!clamped) {
      return;
    }

    this.timeSeriesForm.patchValue({
      start_date: this.formatDateForNgbDatepicker(clamped.start),
      end_date: this.formatDateForNgbDatepicker(clamped.end),
    });

    const asIsoDate = (date: Date) => date.toISOString().slice(0, 10);
    this.alertService.pushAlert(new Alert(
      `${variable.name} has no data at this station for the dates you selected, so the range was changed to ${asIsoDate(clamped.start)} - ${asIsoDate(clamped.end)} (available record: ${variable.startDate} - ${variable.endDate}).`,
      AlertContext.Info, true));
  }
}