import { ApplicationRef, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, signal } from '@angular/core';
import { SiteFilterEnum } from '../../models/enums/site-filter.enum';
import { SiteVariable } from '../../models/site-variable';
import * as L from 'leaflet';
import * as esri from 'esri-leaflet'
import { GestureHandling } from 'leaflet-gesture-handling';
import 'leaflet.snogylop';
import 'leaflet-loading';
import { CustomCompileService } from 'src/app/shared/services/custom-compile.service';
import { environment } from 'src/environments/environment';
import { forkJoin, merge, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { NgbTypeaheadSelectItemEvent } from '@ng-bootstrap/ng-bootstrap';
import { LyraService } from 'src/app/services/lyra.service';
import './leaflet.topojson.js'
import { WatershedService } from '../../generated';

declare let $: any;

@Component({
    selector: 'station-select-card',
    templateUrl: './station-select-card.component.html',
    styleUrls: ['./station-select-card.component.scss'],
    standalone: false
})
export class StationSelectCardComponent implements OnInit {
  @ViewChild('mapDiv') mapElement: ElementRef;

  @Input()
  public mapID: string;
  @Input()
  public defaultSelectedMapFilter: number = SiteFilterEnum.AllSites

  private _selectedVariables: SiteVariable[];
  @Input()
  set selectedVariables(variables: SiteVariable[]) {
    this._selectedVariables = variables;
    this.updateSelectedDataStationsLayer();
  }
  get selectedVariables(): SiteVariable[] {
    return this._selectedVariables;
  }
  @Input()
  public lyraStationAvailableVariablesKey: string = 'variables';
  @Input()
  public variableNamesAllowedToBeAdded: string[] = ['All'];
  @Input()
  public disableAddingVariables: boolean = false;
  @Input()
  public mapHeight: string = '500px';
  @Input()
  public layerControlOpen: boolean = false;
  @Input()
  public defaultMapZoom = 12;
  @Input()
  public canAddDuplicateVariable: boolean = false;
  @Output()
  public addingVariableEvent = new EventEmitter<SiteVariable>();
  @Output()
  public afterSetControl = new EventEmitter();
  @Output()
  public afterLoadMap = new EventEmitter();
  @Output()
  public onMapMoveEnd = new EventEmitter();
  @Output()
  public selectedStationPropertiesUpdateEvent = new EventEmitter();
  @Output()
  public displayingTributaryAreaLayerUpdateEvent = new EventEmitter<boolean>();
  @Output()
  public mapAndStationsLoadedEvent = new EventEmitter();

  public selectedSiteProperties = signal<any>(null);
  public selectedSiteAvailableVariables = signal<SiteVariable[]>([]);
  public selectedSiteStation = signal<string>(null);
  public selectedSiteDescription = signal<string>(null);
  public selectedSiteShortName = signal<string>(null);
  public canViewTributaryArea = signal(false);
  public canZoomTributaryArea = signal(false);

  public map: L.Map;
  public featureLayer: any;
  public layerControl: L.Control.Layers;
  public tileLayers: { [key: string]: any } = {};
  public overlayLayers: { [key: string]: any } = {};
  public maskLayer: any;
  public siteLocationLayer: any;
  public wmsParams: any;
  public currentMask: L.Layers;
  public iconDefault: any;
  public selectedIconDefault: any;
  public selectedStationProperties: any;
  public selectedStationTributaryAreaLayer: any;
  public allStationsLayer: any;
  public hasRainfallLayer: any;
  public hasDischargeLayer: any;
  public hasConductivityLayer: any;
  public selectedDataStationsLayer: any;
  public rainfallIconDefault: any;
  public dischargeIconDefault: any;
  public conductivityIconDefault: any;
  public selectedDataStationsIconDefault: any;
  public currentlySelectedLayer: any;
  public currentlySelectedUnderlyingLayer: any;
  public markers: L.FeatureGroup;
  public topoJSONrsbs: any;

  public allStations: any;

  public stationFilterTypes = signal<StationFilterSelect[]>([]);
  public selectedStationFilter = signal<StationFilterSelect>(null);

  public searchText: string;
  // Pushed on input focus so the typeahead re-opens with the current term.
  public searchFocus$ = new Subject<string>();
  public availableSitesToSearchFrom: any;

  constructor(
    private appRef: ApplicationRef,
    private cdr: ChangeDetectorRef,
    private compileService: CustomCompileService,
    private watershedService: WatershedService,
    private lyraService: LyraService
  ) { }

  public ngOnInit(): void {
    this.tileLayers = Object.assign({}, {
      'Aerial': L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Aerial',
        maxNativeZoom: 16,
        maxZoom: 22
      }),
      'Street': L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Street',
        maxNativeZoom: 16,
        maxZoom: 22
      }),
      'Terrain': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Terrain',
        maxNativeZoom: 16,
        maxZoom: 22
      }),
      'Hillshade': L.tileLayer('https://wtb.maptiles.arcgis.com/arcgis/rest/services/World_Topo_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Hillshade',
        maxNativeZoom: 15,
        maxZoom: 22
      })
    }, this.tileLayers);

    const backboneWMSOptions = ({
      layers: 'Nebula:Backbones',
      transparent: true,
      format: 'image/png',
      tiled: true,
      pane: 'nebulaOverlayPane'
    } as L.WMSOptions);

    const watershedsWMSOptions = ({
      layers: 'Nebula:Watersheds',
      transparent: true,
      format: 'image/png',
      tiled: true,
      pane: 'nebulaOverlayPane'
    } as L.WMSOptions);


    this.overlayLayers = Object.assign({}, {
      '<span><img src=\'../../assets/data-dashboard/backbone.png\' height=\'12px\' style=\'margin-bottom:3px;\' /> Streams</span>': L.tileLayer.wms(environment.geoserverMapServiceUrl + '/wms?', backboneWMSOptions),
      '<span><img src=\'../../assets/data-dashboard/watershed.png\' height=\'12px\' style=\'margin-bottom:3px;\' /> Watersheds</span>': L.tileLayer.wms(environment.geoserverMapServiceUrl + '/wms?', watershedsWMSOptions),
      '<span>Stormwater Network <br/> <img src=\'../../assets/data-dashboard/stormwaterNetwork.png\' height=\'50\'/> </span>': esri.dynamicMapLayer({ url: 'https://ocgis.com/arcpub/rest/services/Flood/Stormwater_Network/MapServer/' })
    })

    this.compileService.configure(this.appRef);
  }

  public externalAddSiteVariableReturnMessageIfFailed(station:string, variableName:string) : string {
    const selectedStation = this.allStations.filter(x => x.properties.station == station)[0];
    if (selectedStation == null || selectedStation == undefined) {
      return `Could not find station with ID:${station}`;
    }

    const stationAvailableVariables = this.getAvailableVariables(selectedStation.properties);
    if (stationAvailableVariables == null || stationAvailableVariables == undefined || stationAvailableVariables.length == 0) {
      return `Station with ID:${station} has no available variables`
    }

    const selectedVariable = stationAvailableVariables.filter(x => x.variable == variableName)[0];
    if (selectedVariable == null || selectedVariable == undefined) {
      return  `Station with ID:${station} does not have an available variable that is associated with the key:${variableName}`;
    }
    
    this.addVariableToSelection(stationAvailableVariables.filter(x => x.variable == variableName)[0]);
  }

  public updateSelectedStation(selectedStationProperties: any) {
    this.selectedSiteAvailableVariables.set(this.getAvailableVariables(selectedStationProperties));
    this.canViewTributaryArea.set(selectedStationProperties.upstream);
    this.selectedSiteDescription.set(selectedStationProperties.stname);
    this.selectedSiteShortName.set(selectedStationProperties.shortname);
    this.selectedSiteStation.set(selectedStationProperties.station);
    this.cdr.detectChanges();
    this.map.invalidateSize();
  }

  public getAvailableVariables(featureProperties: any) : SiteVariable[] {
    const availableVariables = [];
    const baseSiteVariable = new SiteVariable(
      {
        stationShortName: featureProperties.shortname,
        station: featureProperties.station,
        nearestRainfallStationInfo: {
          stationLongName: featureProperties.nearest_rainfall_station_info.stname,
          station: featureProperties.nearest_rainfall_station_info.station
        }
      });

    if (featureProperties[this.lyraStationAvailableVariablesKey] == null || featureProperties[this.lyraStationAvailableVariablesKey].length == 0) {
      return availableVariables;
    }

    for (const variableName of featureProperties[this.lyraStationAvailableVariablesKey]) {
      const variableInfo = featureProperties[variableName];
      const siteVariable = Object.assign(new SiteVariable({
        name: variableInfo.name,
        description: variableInfo.description,
        variable: variableInfo.variable,
        startDate: new Date(`${variableInfo.period_start.slice(0, 4)}-${variableInfo.period_start.slice(4, 6)}-${variableInfo.period_start.slice(6, 8)}`).toLocaleDateString(),
        endDate: new Date(`${variableInfo.period_end.slice(0, 4)}-${variableInfo.period_end.slice(4, 6)}-${variableInfo.period_end.slice(6, 8)}`).toLocaleDateString(),
        allowedAggregations: variableInfo.allowed_aggregations
      }), baseSiteVariable);
      availableVariables.push(siteVariable);
    }

    if (!featureProperties.has_rainfall && featureProperties.nearest_rainfall_station != null) {
      const rainfallStationProperties = featureProperties.nearest_rainfall_station_info;
      const rainfallInfo = rainfallStationProperties.rainfall_info;
      const rainfallSiteVariable = new SiteVariable({
        name: rainfallInfo.name,
        description: rainfallInfo.description,
        variable: rainfallInfo.variable,
        gage: rainfallStationProperties.stname,
        startDate: new Date(`${rainfallInfo.period_start.slice(0, 4)}-${rainfallInfo.period_start.slice(4, 6)}-${rainfallInfo.period_start.slice(6, 8)}`).toLocaleDateString(),
        endDate: new Date(`${rainfallInfo.period_end.slice(0, 4)}-${rainfallInfo.period_end.slice(4, 6)}-${rainfallInfo.period_end.slice(6, 8)}`).toLocaleDateString(),
        allowedAggregations: rainfallInfo.allowed_aggregations,
        stationShortName: rainfallStationProperties.shortname,
        station: rainfallStationProperties.station
      });
      availableVariables.push(rainfallSiteVariable);
    }

    return availableVariables;
  }

  public siteSelectedAndVariablesFound(): boolean {
    return this.selectedSiteDescription() && this.selectedSiteAvailableVariables() != null && this.selectedSiteAvailableVariables().length > 0
  }

  public variableNameCanBeAddedToSelection(variableName: string): boolean {
    if (this.variableNamesAllowedToBeAdded.length == 1 && this.variableNamesAllowedToBeAdded[0] == 'All') {
      return true;
    }

    return this.variableNamesAllowedToBeAdded.length > 0 && this.variableNamesAllowedToBeAdded.includes(variableName);
  }

  public addVariableToSelection(variable: SiteVariable): void {
    // Does NOT push into this.selectedVariables. That is an @Input, and pushing
    // mutated the parent's array in place -- which a signal cannot observe, so
    // the parent never re-rendered and its disabled-state predicates went
    // stale. The parent owns the list and updates it from addingVariableEvent;
    // the new value arrives back through the input setter.
    this.addingVariableEvent.emit(variable);
    this.updateSelectedDataStationsLayer();
  }

  public variablePresentInSelectedVariables(variable: SiteVariable): boolean {
    return this.selectedVariables.length > 0 && this.selectedVariables.some(x => x.name == variable.name && x.station == variable.station);
  }

  public disableAddingVariable(variable: SiteVariable): boolean {
    if (this.disableAddingVariables) {
      return true;
    }

    if (this.canAddDuplicateVariable) {
      return false;
    }

    return this.variablePresentInSelectedVariables(variable);
  }

  //#region mapFunctions
  public ngAfterViewInit(): void {
    this.initializeMap();
  }

  public initializeMap(): void {

    const mapOptions: L.MapOptions = {
      minZoom: 6,
      maxZoom: 22,
      layers: [
        this.tileLayers.Street,
        this.overlayLayers['<span><img src=\'../../assets/data-dashboard/backbone.png\' height=\'12px\' style=\'margin-bottom:3px;\' /> Streams</span>'],
        this.overlayLayers['<span><img src=\'../../assets/data-dashboard/watershed.png\' height=\'12px\' style=\'margin-bottom:3px;\' /> Watersheds</span>'],
      ],
      gestureHandling: true,
      loadingControl: true

    } as L.MapOptions;

    this.map = L.map(this.mapID, mapOptions);
    this.initializePanes();
    this.initializeMapEvents();

    forkJoin([
      this.watershedService.watershedsWatershedNameGetWatershedMaskGet('Aliso Creek'),
      this.lyraService.getRSBTopoJson(),
      this.lyraService.getSiteLocationGeoJson()
    ]).subscribe(([maskString, topoJSON, sites]) => {
      const mask = JSON.parse(maskString);
      this.maskLayer = L.geoJSON(mask, {
        invert: true,
        style: function (feature) {
          return {
            fillColor: '#323232',
            fill: true,
            fillOpacity: 0.2,
            color: '#3388ff',
            weight: 5,
            stroke: true
          };
        }
      });

      L.Map.addInitHook('addHandler', 'gestureHandling', GestureHandling);

      this.maskLayer.addTo(this.map);
      this.defaultFitBounds();

      this.setupMarkers();

      this.topoJSONrsbs = topoJSON;

      const topoJSONOverlay = L.topoJson(topoJSON, {
        style: function (feature) {
          return {
            color: '#ff4500',
            opacity: 1,
            weight: 1,
            fillColor: '#35495d',
            fillOpacity: 0.0,
          };
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(
            '<p>' + `CatchIDN: ${feature.properties.CatchIDN}` + '</p>'
          );
        },
      });

      this.overlayLayers[
        '<span><img src=\'../../assets/data-dashboard/regionalSubbasin.png\' height=\'12px\' style=\'margin-bottom:3px;\' /> Regional Subbasins</span>'] = topoJSONOverlay;

      this.setControl();

      this.allStations = sites.features;
      this.allStations.forEach(x => {
        if (x.properties.nearest_rainfall_station != null) {
          x.properties.nearest_rainfall_station_info = this.allStations.filter(y => y.properties.station === x.properties.nearest_rainfall_station)[0].properties;
        }
      });
      this.setupStationFilterAndLayers();

      this.selectedStationFilter.set(this.stationFilterTypes().filter(x => x.SiteFilterEnum == this.defaultSelectedMapFilter)[0]);
      this.updateMarkerDisplay();
      this.mapAndStationsLoadedEvent.emit();
    });
  }

  public selectFeature(feature) {
    if (this.currentlySelectedLayer) {
      this.markers.clearLayers();
      this.currentlySelectedLayer = null;
    }

    this.clearTributaryAreaLayer();

    this.currentlySelectedLayer = new L.GeoJSON(feature, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, { icon: this.selectedIconDefault, zIndexOffset: 1000 });
      }
    });

    this.markers.addLayer(this.currentlySelectedLayer);
    this.selectedStationProperties = feature.properties;
    this.updateSelectedStation(this.selectedStationProperties);
  }

  public setupStationFilterAndLayers() {
    this.allStationsLayer = L.geoJSON(this.allStations);

    const allSitesOption = new StationFilterSelect({ Display: 'All Sites', SiteFilterEnum: SiteFilterEnum.AllSites, Layer: this.allStationsLayer, Stations: this.allStations });

    const rainfallOptions = this.allStations.filter(x => x.properties.has_rainfall);
    this.hasRainfallLayer = L.geoJSON(rainfallOptions, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: this.rainfallIconDefault });
      }.bind(this)
    });

    const rainfallOption = new StationFilterSelect({ Display: 'Has Rainfall Data', SiteFilterEnum: SiteFilterEnum.HasRainfall, Layer: this.hasRainfallLayer, Stations: rainfallOptions });

    const dischargeOptions = this.allStations.filter(x => x.properties.has_discharge)
    this.hasDischargeLayer = L.geoJSON(dischargeOptions, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: this.dischargeIconDefault });
      }.bind(this)
    });

    const dischargeOption = new StationFilterSelect({ Display: 'Has Discharge Data', SiteFilterEnum: SiteFilterEnum.HasDischarge, Layer: this.hasDischargeLayer, Stations: dischargeOptions });

    const conductivityOptions = this.allStations.filter(x => x.properties.has_conductivity)
    this.hasConductivityLayer = L.geoJSON(conductivityOptions, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon: this.conductivityIconDefault });
      }.bind(this)
    });

    const conductivityOption = new StationFilterSelect({ Display: 'Has Conductivity Data', SiteFilterEnum: SiteFilterEnum.HasConductivity, Layer: this.hasConductivityLayer, Stations: conductivityOptions });

    this.stationFilterTypes.set([allSitesOption, rainfallOption, dischargeOption, conductivityOption]);
  }

  public initializePanes(): void {
    const nebulaOverlayPane = this.map.createPane('nebulaOverlayPane');
    nebulaOverlayPane.style.zIndex = 10000;
    this.map.getPane('markerPane').style.zIndex = 10001;
    this.map.getPane('popupPane').style.zIndex = 10002;
  }

  public setControl(): void {
    const loadingControl = L.Control.loading({
      separate: true
    });
    this.map.addControl(loadingControl);
    this.layerControl = new L.Control.Layers(this.tileLayers, this.overlayLayers)
      .addTo(this.map);
    this.map.zoomControl.setPosition('topright');

    this.afterSetControl.emit(this.layerControl);
  }

  public initializeMapEvents(): void {
    this.map.on('load', (event: L.LeafletEvent) => {
      this.afterLoadMap.emit(event);
    });
    this.map.on('moveend', (event: L.LeafletEvent) => {
      this.onMapMoveEnd.emit(event);
    });

    let dblClickTimer = null;

    //to handle click for select area vs double click for zoom
    this.map.on('click', (event: L.LeafletEvent) => {
      this.layerControlOpen = false;
      if (dblClickTimer !== null) {
        return;
      }
      dblClickTimer = setTimeout(() => {
        //this.getNeighborhoodFromLatLong(event.latlng, true);
        dblClickTimer = null;
      }, 200);
    }).on('dblclick', () => {
      clearTimeout(dblClickTimer);
      dblClickTimer = null;
      this.map.zoomIn();
    })

    $('.leaflet-control-layers').hover(
      () => { this.layerControlOpen = true; },
      () => { this.layerControlOpen = false; }
    );
  }

  //fitBounds will use it's default zoom level over what is sent in
  //if it determines that its max zoom is further away. This can make the 
  //map zoom out to inappropriate levels sometimes, and then setZoom 
  //won't be honored because it's in the middle of a zoom. So we'll manipulate
  //it a bit.
  public defaultFitBounds(): void {
    const target = this.map._getBoundsCenterZoom(this.maskLayer.getBounds(), null);
    this.map.setView(target.center, this.defaultMapZoom, null);
  }

  //Known bug in leaflet that during bundling the default image locations can get messed up
  //https://stackoverflow.com/questions/41144319/leaflet-marker-not-found-production-env
  //We could do some kind of custom marker which would require less extra, but this should work for now
  public setupMarkers() {
    this.iconDefault = this.buildMarker('assets/marker-icon.png', 'assets/marker-icon-2x.png');
    this.rainfallIconDefault = this.buildMarker('/assets/main/map-icons/marker-icon-orange.png', '/assets/main/map-icons/marker-icon-2x-orange.png');
    this.dischargeIconDefault = this.buildMarker('/assets/main/map-icons/marker-icon-red.png', '/assets/main/map-icons/marker-icon-2x-red.png');
    this.conductivityIconDefault = this.buildMarker('/assets/main/map-icons/marker-icon-violet.png', '/assets/main/map-icons/marker-icon-2x-violet.png');
    this.selectedDataStationsIconDefault = this.buildMarker('/assets/main/map-icons/marker-icon-green.png', '/assets/main/map-icons/marker-icon-2x-green.png');

    //this will be for the selected icon
    this.markers = new L.FeatureGroup().addTo(this.map);
    this.selectedIconDefault = this.buildMarker('/assets/main/map-icons/marker-icon-selected.png', '/assets/main/map-icons/marker-icon-2x-selected.png');

    L.Marker.prototype.options.icon = this.iconDefault;
  }

  public buildMarker(iconUrl: string, iconRetinaUrl: string): any {
    const shadowUrl = 'assets/marker-shadow.png';
    return L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }

  public viewTributaryArea() {
    if (!this.selectedStationProperties || !this.selectedStationProperties.upstream) {
      this.canZoomTributaryArea.set(false);
      this.canViewTributaryArea.set(false);
      return;
    }

    const upstreamCatchIDNs = this.selectedStationProperties.upstream;
    const tempRSBs = Object.assign({}, this.topoJSONrsbs);
    const topoJSONObjects = tempRSBs.objects.data.geometries.filter(x => upstreamCatchIDNs.includes(x.properties.CatchIDN));
    tempRSBs.objects = topoJSONObjects;
    this.selectedStationTributaryAreaLayer = L.topoJson(tempRSBs, {
      style: function (feature) {
        return {
          color: '#D55E00',
          opacity: 1,
          weight: 1,
          fillColor: '#D55E00',
          fillOpacity: 0.5,
        };
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(
          '<p>' + `CatchIDN: ${feature.properties.CatchIDN}` + '</p>'
        );
      },
    });

    this.selectedStationTributaryAreaLayer.addTo(this.map);
    this.selectedStationTributaryAreaLayer.bringToFront();
    this.canZoomTributaryArea.set(true);
  }

  public zoomInOnTributaryArea() {
    if (!this.selectedStationTributaryAreaLayer) {
      this.canZoomTributaryArea.set(false);
      return;
    }

    this.map.fitBounds(this.selectedStationTributaryAreaLayer.getBounds());
  }

  public updateMarkerDisplay() {
    if (!this.stationFilterTypes()) {
      return;
    }

    if (this.currentlySelectedUnderlyingLayer) {
      this.currentlySelectedUnderlyingLayer = null;
    }

    if (this.siteLocationLayer) {
      this.map.removeLayer(this.siteLocationLayer);
      this.siteLocationLayer = null;
    }

    this.clearTributaryAreaLayer();

    this.siteLocationLayer = this.selectedStationFilter().Layer;
    this.siteLocationLayer.on('click', (event: L.LeafletEvent) => {
      this.selectFeature(event.propagatedFrom.feature);
    })

    this.siteLocationLayer.addTo(this.map);
    if (this.selectedDataStationsLayer) {
      this.map.removeLayer(this.selectedDataStationsLayer);
      this.selectedDataStationsLayer.addTo(this.map);
    }
    this.availableSitesToSearchFrom = this.selectedStationFilter().Stations;
  }

  clearTributaryAreaLayer() {
    if (!this.selectedStationTributaryAreaLayer) {
      return;
    }
    this.map.removeLayer(this.selectedStationTributaryAreaLayer);
    this.selectedStationTributaryAreaLayer = null;
    this.canZoomTributaryArea.set(false);
    this.canViewTributaryArea.set(false);
  }

  public updateSelectedDataStationsLayer() {
    if (this.selectedDataStationsLayer) {
      this.map.removeLayer(this.selectedDataStationsLayer);
      this.selectedDataStationsLayer = null;
    }

    if (this.selectedVariables == null || this.selectedVariables.length == 0) {
      return;
    }

    const selectedOptions = this.allStations.filter(x => this.selectedVariables.some(y => y.station == x.properties.station));
    this.selectedDataStationsLayer = L.geoJSON(selectedOptions, {
      pointToLayer: (feature, latlng) => {
        return L.marker(latlng, { icon: this.selectedDataStationsIconDefault });
      }
    });

    this.selectedDataStationsLayer.on('click', (event: L.LeafletEvent) => {
      this.selectFeature(event.propagatedFrom.feature);
    })

    this.selectedDataStationsLayer.addTo(this.map);
  }
  //#endregion

  public onSearchSelect(event: NgbTypeaheadSelectItemEvent<StationSearchResult>) {
    // Without preventDefault, ngModel would be assigned the result object;
    // searchText stays a plain string so the input keeps showing the label.
    event.preventDefault();
    this.searchText = event.item.StationPropertyValue;
    this.selectStationByStation(event.item.StationID);
  }

  // Renders each dropdown row's label; the two-line layout lives in the
  // resultTemplate in the template file.
  public searchResultFormatter = (result: StationSearchResult) => result.StationPropertyValue;

  public selectStationByStation(station: string) {
    const selectedFeature = this.availableSitesToSearchFrom.find(x => x.properties.station === station);
    this.selectFeature(selectedFeature);
    this.map.setView(this.currentlySelectedLayer.getBounds().getCenter());
  }

  // NgbTypeahead drives the dropdown from this operator rather than a
  // (completeMethod) callback writing into a suggestions array. Merging
  // searchFocus$ reopens the list when the input regains focus, which is what
  // the old reFocus()/show() pair did imperatively.
  public search = (text$: Observable<string>): Observable<StationSearchResult[]> =>
    merge(
      text$.pipe(debounceTime(200), distinctUntilChanged()),
      this.searchFocus$
    ).pipe(map(term => this.matchStations(term)));

  private matchStations(term: string): StationSearchResult[] {
    const searchText = term?.trim().toLowerCase();
    if (!searchText) {
      return [];
    }

    // One station can match on several properties, and each match is its own
    // row so the user can see which field matched.
    const matchableProperties: { property: string; label: string }[] = [
      { property: 'station', label: 'StationID' },
      { property: 'shortname', label: 'Short Name' },
      { property: 'stname', label: 'Description' }
    ];

    const results: StationSearchResult[] = [];
    this.availableSitesToSearchFrom.forEach(site => {
      matchableProperties.forEach(({ property, label }) => {
        const value = site.properties[property];
        if (value != null && value.toLowerCase().includes(searchText)) {
          results.push({
            StationProperty: label,
            StationPropertyValue: value,
            StationID: site.properties.station
          });
        }
      });
    });

    return results.sort((a, b) => a.StationPropertyValue.localeCompare(b.StationPropertyValue));
  }
}

export interface StationSearchResult {
  StationProperty: string;
  StationPropertyValue: string;
  StationID: string;
}

export class StationFilterSelect {
  Display: string;
  SiteFilterEnum: SiteFilterEnum
  Layer: any;
  Stations: any[];

  public constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
