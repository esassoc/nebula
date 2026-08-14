export class SiteVariable {
  name: string;
  description: string;
  variable: string;
  gage: string;
  stationShortName: string;
  stationLongName: string;
  station: string;
  // Display only. These are assigned toLocaleDateString() output, so they were
  // typed Date while holding strings -- Date APIs on them compiled and then
  // failed at runtime. Typed honestly; use periodStart/periodEnd for logic.
  startDate: string;
  endDate: string;
  // Machine-readable record bounds (YYYY-MM-DD). Null when Lyra omits or
  // malforms the period, which DateRangeHelpers.periodToIso reports as null.
  periodStart: string | null;
  periodEnd: string | null;
  nearestRainfallStationInfo: SiteVariable;
  allowedAggregations: string[];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}