import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LyraService } from 'src/app/services/lyra.service';
import { AlertService } from 'src/app/shared/services/alert.service';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { SiteVariable } from 'src/app/shared/models/site-variable';
import DateRangeHelpers from 'src/app/shared/helpers/date-range-helpers';
import { Alert } from 'src/app/shared/models/alert';
import { AlertContext } from 'src/app/shared/models/enums/alert-context.enum';
import { HydstraAggregationMethod } from 'src/app/shared/models/hydstra/hydstra-aggregation-mode';
import { HydstraInterval } from 'src/app/shared/models/hydstra/hydstra-interval';
import { HydstraWeatherCondition } from 'src/app/shared/models/hydstra/hydstra-weather-condition';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { ActivatedRoute } from '@angular/router';
import { StationSelectCardComponent } from 'src/app/shared/components/station-select-card/station-select-card.component';
import { DateTime } from 'luxon';
import { CustomRichTextTypeEnum } from 'src/app/shared/generated/enum/custom-rich-text-type-enum';
import { UserDto } from 'src/app/shared/generated';

declare let $: any;
declare let vegaEmbed: any;

@Component({
    selector: 'nebula-time-series-analysis',
    templateUrl: './time-series-analysis.component.html',
    styleUrls: ['./time-series-analysis.component.scss'],
    standalone: false
})
export class TimeSeriesAnalysisComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  public currentUser: UserDto;

  @ViewChild('selectedDataCardRef') selectedDataCardRef: ElementRef;
  @ViewChild('stationSelect') stationSelect: StationSelectCardComponent;

  public mapID: string = 'TimeSeriesAnalysisStationSelectMap';

  public richTextTypeID = CustomRichTextTypeEnum.TimeSeriesAnalysis;

  public vegaSpec = signal<Object>(null);

  public hydstraAggregationMethods: HydstraAggregationMethod[] = Object.values(HydstraAggregationMethod);
  public hydstraIntervals: HydstraInterval[] = Object.values(HydstraInterval);
  public hydstraWeatherConditions: HydstraWeatherCondition[] = Object.values(HydstraWeatherCondition)

  public currentDate = DateTime.utc();
  public startDate = this.currentDate.minus({months:3});
  public timeSeriesForm = new UntypedFormGroup({
    start_date: new UntypedFormControl({ year: this.startDate.year, month: this.startDate.month, day: this.startDate.day }, [Validators.required]),
    end_date: new UntypedFormControl({ year: this.currentDate.year, month: this.currentDate.month, day: this.currentDate.day }, [Validators.required]),
    timeseries: new UntypedFormArray([])
  });
  public timeSeriesFormDefault = this.timeSeriesForm.value;

  public selectedSiteProperties: any;
  public selectedSiteAvailableVariables = signal<SiteVariable[]>([]);
  public selectedSiteStation = signal<string>(null);
  public selectedSiteName = signal<string>(null);
  public selectedVariables = signal<SiteVariable[]>([]);

  public errorOccurred = signal(false);
  public errorMessage = signal<string>(null);
  public gettingTimeSeriesData = signal(false);
  public currentlyDisplayingRequestDto: any;
  public downloadingChartData = signal(false);
  public lyraMessages = signal<Alert[]>([]);
  currentlyDisplayingRequestLinkText: string;

  constructor(
    private cdr: ChangeDetectorRef,
    private lyraService: LyraService,
    private formBuilder: UntypedFormBuilder,
    private authenticationService: AuthenticationService,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {
  }

  ngOnInit() {
    this.authenticationService.getCurrentUser().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(currentUser => {
      this.currentUser = currentUser;
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

    if (!this.timeSeriesForm.valid || !this.timeseries().valid) {
      Object.keys(this.timeSeriesForm.controls).forEach(field => {
        const control = this.timeSeriesForm.get(field);
        control.markAsTouched({ onlySelf: true });
      });
      for (const [index, formGroup] of this.timeseries().controls.entries()) {
        if (formGroup instanceof UntypedFormGroup) {
          Object.keys(formGroup.controls).forEach(field => {
            const control = this.timeseries().controls[index].get(field);
            control.markAsTouched({ onlySelf: true });
          })
        }
      }
      return;
    }

    const swnTimeSeriesRequestDto =
    {
      start_date: this.getDateFromTimeSeriesFormDateObject('start_date'),
      end_date: this.getDateFromTimeSeriesFormDateObject('end_date'),
      timeseries: this.getTimeSeriesListFromTimerSeriesFormObject()
    };
    this.gettingTimeSeriesData.set(true);
    this.errorOccurred.set(false);
    this.vegaSpec.set(null);
    this.currentlyDisplayingRequestDto = null;
    this.lyraMessages.set([]);
    this.timeSeriesForm.disable({ emitEvent: false });
    this.lyraService.getTimeSeriesAnalysisPlot(swnTimeSeriesRequestDto).subscribe(result => {
      if (result.hasOwnProperty('data') && result.data.hasOwnProperty('spec')) {
        if (result.data.hasOwnProperty('messages') && result.data.messages.length > 0) {
          this.lyraMessages.update(m => [...m, ...result.data.messages.filter(x => x != '').map(x => new Alert(x, AlertContext.Warning, true))]);
        }
        this.vegaSpec.set(result.data.spec);
        vegaEmbed('#vis', this.vegaSpec());
        this.currentlyDisplayingRequestDto = swnTimeSeriesRequestDto;
        this.currentlyDisplayingRequestLinkText = `${window.location.origin}${window.location.pathname}?json=${JSON.stringify(this.currentlyDisplayingRequestDto)}`;
      }
      else {
        this.errorOccurred.set(true);
        if (result.hasOwnProperty('msg')) {
          this.lyraMessages.update(m => [...m, new Alert(`There was an error with the entered query. Message: ${result.msg}`, AlertContext.Danger, true)]);
        }
      }
      this.gettingTimeSeriesData.set(false);
      this.timeSeriesForm.enable({ emitEvent: false });
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
      this.timeSeriesForm.enable({ emitEvent: false });
    });
  }

  public downloadChartData() {
    if (!this.currentlyDisplayingRequestDto) {
      return;
    }

    this.downloadingChartData.set(true);
    this.timeSeriesForm.disable({ emitEvent: false });
    this.lyraService.downloadTimeSeriesAnalysisData(this.currentlyDisplayingRequestDto).subscribe(result => {
      const blob = new Blob([result], {
        type: 'text/csv'
      });

      //Create a fake object to trigger downloading the csv file that was returned
      const a: any = document.createElement('a');
      document.body.appendChild(a);

      a.style = 'display: none';
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      const date = new Date();
      a.download = `SWN_Multi_Site_Multi_Variable_Data_Request_${date.getMonth() + 1}_${date.getDate()}_${date.getFullYear()}_${date.getHours()}_${date.getMinutes()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.downloadingChartData.set(false);
      this.timeSeriesForm.enable({ emitEvent: false });
    })
  }

  public getAvailableAggregationMethods(variable: SiteVariable): HydstraAggregationMethod[] {
    return this.hydstraAggregationMethods.filter(x => variable.allowedAggregations.includes(x.value));
  }

  public addVariableToSelection(variable: SiteVariable): void {
    // The parent owns selectedVariables. station-select-card used to push into
    // this array in place, which a signal cannot observe -- so the Add buttons
    // kept a stale enabled state until some other signal forced a re-render.
    this.selectedVariables.update(v => [...v, variable]);
    DateRangeHelpers.clampFormRangeToVariableRecord(this.timeSeriesForm, variable, this.alertService);
    this.addSiteVariableToQuery(variable);
    this.clearResults();
    this.cdr.detectChanges();
  }

  public removeVariableFromSelection(index: number): void {
    this.selectedVariables.update(v => v.filter((_, i) => i !== index));
    this.removeSiteVariableToQuery(index);
    this.clearResults();
  }

  public clearAllVariables(): void {
    this.selectedVariables.set([]);
    this.timeseries().clear();
    this.clearResults();
  }

  public variableNotPresentInSelectedVariables(variable: SiteVariable): boolean {
    return this.selectedVariables().length == 0 || !this.selectedVariables().some(x => x.name == variable.name && x.station == variable.station);
  }

  public catchExtraSymbols(event: KeyboardEvent): void {
    if (event.code === 'KeyE' || event.code === 'Equal' || event.code === 'Minus' || event.code === 'Plus') {
      event.preventDefault();
    }
  }

  public catchPastedSymbols(event: any): void {
    let val = event.clipboardData.getData('text/plain');
    if (val && (val.includes('+') || val.includes('-') || val.includes('e') || val.includes('E'))) {
      val = val.replace(/\+|\-|e|E/g, '');
      event.preventDefault();
    }
  }

  public scrollIntoView(el: ElementRef) {
    el.nativeElement.scrollIntoView(true)
  }

  public formatDateForNgbDatepicker(date: Date): any {
    const dateToChange = new Date(date);
    return { year: dateToChange.getUTCFullYear(), month: dateToChange.getUTCMonth() + 1, day: dateToChange.getUTCDate() };
  }

  public closeAlert(index: number) {
    this.lyraMessages.update(m => m.filter((_, i) => i !== index));
  }

  public clearResults() {
    this.vegaSpec.set(null);
    this.currentlyDisplayingRequestDto = null;
    this.lyraMessages.set([]);
    this.errorOccurred.set(false);
  }

  //#region Form Functionality

  get f() {
    return this.timeSeriesForm.controls;
  }

  timeseries(): UntypedFormArray {
    return this.timeSeriesForm.get('timeseries') as UntypedFormArray
  }

  newSiteVariableToQuery(variable: SiteVariable): UntypedFormGroup {
    return this.formBuilder.group({
      variable: variable,
      interval: new UntypedFormControl(HydstraInterval.Daily.value, [Validators.required]),
      aggregation_method: new UntypedFormControl(variable.allowedAggregations[0], [Validators.required]),
      weather_condition: new UntypedFormControl(HydstraWeatherCondition.Both.value, [Validators.required])
    })
  }

  addSiteVariableToQuery(variable) {
    this.timeseries().push(this.newSiteVariableToQuery(variable));
  }

  removeSiteVariableToQuery(i: number) {
    this.timeseries().removeAt(i);
  }

  getTimeSeriesListFromTimerSeriesFormObject() {
    return this.timeseries().value.map(x => ({
      variable: x.variable.variable,
      site: x.variable.station,
      interval: x.interval,
      weather_condition: x.weather_condition,
      aggregation_method: x.aggregation_method
    }))
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

  public showOnMapForStation(station : string) {
    this.stationSelect.selectStationByStation(station);
  }

  public populateFormFromURL() {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params == null || params == undefined || !params.hasOwnProperty('json')) {
        return;
      }

      const queriedParams = JSON.parse(params.json);

      //Don't bother if we don't have any timeseries
      if (!queriedParams.hasOwnProperty('timeseries')) {
        return;
      }

      if (queriedParams.start_date != null) {
        const start_date = new Date(queriedParams.start_date);
        this.timeSeriesForm.patchValue({ start_date: { year: start_date.getUTCFullYear(), month: start_date.getUTCMonth() + 1, day: start_date.getUTCDate() } });
      }

      if (queriedParams.end_date != null) {
        const end_date = new Date(queriedParams.end_date);
        this.timeSeriesForm.patchValue({ end_date: { year: end_date.getUTCFullYear(), month: end_date.getUTCMonth() + 1, day: end_date.getUTCDate() } });
      }

      let failuresToDecrementBy = 0;
      const errorMessagesToDisplay = [];

      queriedParams.timeseries.forEach((x, index) => {
        const message = this.stationSelect.externalAddSiteVariableReturnMessageIfFailed(x.site, x.variable);
        if (message != null && message != undefined) {
          errorMessagesToDisplay.push(new Alert(message, AlertContext.Danger, true));
          failuresToDecrementBy++;
          return;
        }

        this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(x, 'aggregation_method', (x => this.selectedVariables()[index - failuresToDecrementBy].allowedAggregations.some(y => y == x)), this.timeseries().controls[index], errorMessagesToDisplay)
        this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(x, 'interval', (x => HydstraInterval.all().some(y => y.value == x)), this.timeseries().controls[index], errorMessagesToDisplay)
        this.updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(x, 'weather_condition', (x => HydstraWeatherCondition.all().some(y => y.value == x)), this.timeseries().controls[index], errorMessagesToDisplay)
      })

      this.lyraMessages.set(errorMessagesToDisplay);
      this.cdr.detectChanges();
      this.scrollIntoView(this.selectedDataCardRef);
    })
  }

  public updateFormWithValueIfProvidedAndPresentPopulateErrorIfNot(jsonObject: any, key: string, validityFunction: any, toUpdate: any, errors: any) {
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

    toUpdate.patchValue({ [key]: value });
  }

}
