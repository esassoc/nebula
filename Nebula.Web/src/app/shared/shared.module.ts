import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NotFoundComponent } from './pages';
import { HeaderNavComponent } from './components';
import { UnauthenticatedComponent } from './pages/unauthenticated/unauthenticated.component';
import { SubscriptionInsufficientComponent } from './pages/subscription-insufficient/subscription-insufficient.component';
import { RouterModule } from '@angular/router';
import { WatershedDetailPopupComponent } from './components/watershed-detail-popup/watershed-detail-popup.component';
import { LinkRendererComponent } from './components/ag-grid/link-renderer/link-renderer.component';
import { FontAwesomeIconLinkRendererComponent } from './components/ag-grid/fontawesome-icon-link-renderer/fontawesome-icon-link-renderer.component';
import { WatershedMapComponent } from './components/watershed-map/watershed-map.component';
import { MultiLinkRendererComponent } from './components/ag-grid/multi-link-renderer/multi-link-renderer.component';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { CustomRichTextComponent } from './components/custom-rich-text/custom-rich-text.component'
import { FieldDefinitionComponent } from './components/field-definition/field-definition.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertDisplayComponent } from './components/alert-display/alert-display.component';
import { FieldDefinitionGridHeaderComponent } from './components/field-definition-grid-header/field-definition-grid-header.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgSelectCustomComponent } from './components/ng-select-custom/ng-select-custom.component';
import { SelectedDataCardComponent } from './components/selected-data-card/selected-data-card.component';
import { StationSelectCardComponent } from './components/station-select-card/station-select-card.component';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { LinkToAnalysisComponent } from './components/link-to-analysis/link-to-analysis.component';
import { CustomDropdownFilterComponent } from './components/custom-dropdown-filter/custom-dropdown-filter.component';
import { CsvDownloadButtonComponent } from './components/csv-download-button/csv-download-button.component';
import { ClearGridFiltersButtonComponent } from './components/clear-grid-filters-button/clear-grid-filters-button.component';
import { EditorModule, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { TinyMceConfigPipe } from './pipes/tiny-mce-config.pipe';

@NgModule({ declarations: [
        AlertDisplayComponent,
        HeaderNavComponent,
        NotFoundComponent,
        UnauthenticatedComponent,
        SubscriptionInsufficientComponent,
        WatershedMapComponent,
        WatershedDetailPopupComponent,
        LinkRendererComponent,
        FontAwesomeIconLinkRendererComponent,
        MultiLinkRendererComponent,
        CustomRichTextComponent,
        FieldDefinitionComponent,
        FieldDefinitionGridHeaderComponent,
        NgSelectCustomComponent,
        SelectedDataCardComponent,
        StationSelectCardComponent,
        LinkToAnalysisComponent,
        CustomDropdownFilterComponent,
        CsvDownloadButtonComponent,
        ClearGridFiltersButtonComponent,
        TinyMceConfigPipe
    ],
    exports: [
        AlertDisplayComponent,
        CommonModule,
        FormsModule,
        NotFoundComponent,
        WatershedMapComponent,
        HeaderNavComponent,
        CustomRichTextComponent,
        FieldDefinitionComponent,
        FieldDefinitionGridHeaderComponent,
        NgSelectCustomComponent,
        SelectedDataCardComponent,
        StationSelectCardComponent,
        LinkToAnalysisComponent,
        CsvDownloadButtonComponent,
        ClearGridFiltersButtonComponent,
        EditorModule,
        TinyMceConfigPipe
    ], imports: [CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,
        SelectDropDownModule,
        EditorModule,
        NgbModule,
        NgSelectModule,
        AutoCompleteModule], providers: [
        { provide: TINYMCE_SCRIPT_SRC, useValue: 'assets/tinymce/tinymce.min.js' },
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: []
    };
  }

  static forChild(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: []
    };
  }
}
