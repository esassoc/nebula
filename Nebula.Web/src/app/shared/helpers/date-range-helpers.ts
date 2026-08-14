import { UntypedFormGroup } from '@angular/forms';
import { SiteVariable } from '../models/site-variable';
import { Alert } from '../models/alert';
import { AlertContext } from '../models/enums/alert-context.enum';
import { AlertService } from '../services/alert.service';

/** The {year, month, day} shape ngb-datepicker form controls hold. */
export interface NgbDateStruct {
  year: number;
  month: number;
  day: number;
}

/**
 * Keeps requested analysis windows inside the period a station actually has
 * data for.
 *
 * Lyra returns 500 Internal Server Error (not a clean "no data" response) when
 * a window contains no observations, and because that unhandled exception
 * bypasses its CORS middleware the browser reports it as a CORS failure with an
 * unreadable body -- so the app cannot even surface the reason. The pages
 * default their window to the last three months, which is entirely after the
 * end of the record for any station whose data lags, making that crash the
 * default experience rather than an edge case.
 */
export default class DateRangeHelpers {
  /** Lyra returns period bounds as YYYYMMDD; convert to YYYY-MM-DD. */
  public static periodToIso(period?: string): string | null {
    if (!period || period.length < 8) {
      return null;
    }
    return `${period.slice(0, 4)}-${period.slice(4, 6)}-${period.slice(6, 8)}`;
  }

  private static utc(iso: string): Date | null {
    return iso ? new Date(`${iso}T00:00:00Z`) : null;
  }

  private static addDaysUtc(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 86400000);
  }

  /** ngb-datepicker struct -> YYYY-MM-DD. */
  public static structToIso(value: NgbDateStruct): string | null {
    if (!value || !value.year) {
      return null;
    }
    return `${value.year}-${value.month.toString().padStart(2, '0')}-${value.day.toString().padStart(2, '0')}`;
  }

  /** Date -> ngb-datepicker struct. UTC getters: the dates are built as UTC. */
  public static dateToStruct(date: Date): NgbDateStruct {
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  }

  /**
   * Returns a window shifted inside [periodStart, periodEnd], or null when the
   * requested window already overlaps the record and needs no adjustment.
   *
   * Any overlap is left alone: a partially-covered window still returns data,
   * and silently moving a range the user chose deliberately would be worse than
   * showing them a short result.
   */
  public static clampToAvailableRange(
    startIso: string, endIso: string,
    periodStartIso: string, periodEndIso: string): { start: Date, end: Date } | null {

    const start = this.utc(startIso);
    const end = this.utc(endIso);
    const periodStart = this.utc(periodStartIso);
    const periodEnd = this.utc(periodEndIso);

    if (!start || !end || !periodStart || !periodEnd) {
      return null;
    }

    // Overlap test: nothing to do unless the window sits entirely outside.
    if (start <= periodEnd && end >= periodStart) {
      return null;
    }

    // Preserve the span the user asked for, anchored to the end of the record,
    // which is the part of the data people almost always want.
    const spanDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const newStart = this.addDaysUtc(periodEnd, -spanDays);

    return {
      start: newStart < periodStart ? periodStart : newStart,
      end: periodEnd,
    };
  }

  /**
   * Moves a page's start_date/end_date controls inside the record for the
   * variable just added, and tells the user when it does.
   *
   * Lives here rather than in each page so the clamp rule and the wording stay
   * in one place -- all three analysis pages share the same form control names
   * and the same failure.
   */
  public static clampFormRangeToVariableRecord(
    form: UntypedFormGroup, variable: SiteVariable, alertService: AlertService): void {

    if (!form || !variable || !variable.periodStart || !variable.periodEnd) {
      return;
    }

    const clamped = this.clampToAvailableRange(
      this.structToIso(form.get('start_date')?.value),
      this.structToIso(form.get('end_date')?.value),
      variable.periodStart,
      variable.periodEnd);

    if (!clamped) {
      return;
    }

    form.patchValue({
      start_date: this.dateToStruct(clamped.start),
      end_date: this.dateToStruct(clamped.end),
    });

    const asIsoDate = (date: Date) => date.toISOString().slice(0, 10);
    alertService.pushAlert(new Alert(
      `${variable.name} has no data at this station for the dates you selected, so the range was ` +
      `changed to ${asIsoDate(clamped.start)} - ${asIsoDate(clamped.end)} ` +
      `(available record: ${variable.startDate} - ${variable.endDate}).`,
      AlertContext.Info, true));
  }
}
