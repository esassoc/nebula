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
  public static periodToIso(period: string): string {
    if (!period || period.length < 8) {
      return null;
    }
    return `${period.slice(0, 4)}-${period.slice(4, 6)}-${period.slice(6, 8)}`;
  }

  private static utc(iso: string): Date {
    return iso ? new Date(`${iso}T00:00:00Z`) : null;
  }

  private static addDaysUtc(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 86400000);
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
    periodStartIso: string, periodEndIso: string): { start: Date, end: Date } {

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
}
