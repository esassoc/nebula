export class SiteVariable {
  name: string;
  description: string;
  variable: string;
  gage: string;
  stationShortName: string;
  stationLongName: string;
  station: string;
  // Display-only: these hold toLocaleDateString() output, not Date objects.
  startDate: Date;
  endDate: Date;
  // Machine-readable record bounds (YYYY-MM-DD) used to keep requested windows
  // inside the data Lyra actually has.
  periodStart: string;
  periodEnd: string;
  nearestRainfallStationInfo: SiteVariable;
  allowedAggregations: string[];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}