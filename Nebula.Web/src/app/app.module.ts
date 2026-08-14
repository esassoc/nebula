import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER, ErrorHandler, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors, withXhr } from "@angular/common/http";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HomeIndexComponent } from './pages/home/home-index/home-index.component';
import { UserListComponent } from './pages/user-list/user-list.component';
import { RouterModule } from '@angular/router';
import { UserInviteComponent } from './pages/user-invite/user-invite.component';
import { UserDetailComponent } from './pages/user-detail/user-detail.component';
import { UserEditComponent } from './pages/user-edit/user-edit.component';
import { WatershedDetailComponent } from './pages/watershed-detail/watershed-detail.component';
import { AgGridModule } from 'ag-grid-angular';
import { DecimalPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginCallbackComponent } from './pages/login-callback/login-callback.component';
import { HelpComponent } from './pages/help/help.component';
import { SelectDropDownModule } from 'ngx-select-dropdown'
import { DisclaimerComponent } from './pages/disclaimer/disclaimer.component';
import { FieldDefinitionListComponent } from './pages/field-definition-list/field-definition-list.component';
import { FieldDefinitionEditComponent } from './pages/field-definition-edit/field-definition-edit.component';
import { TimeSeriesAnalysisComponent } from './pages/time-series-analysis/time-series-analysis.component';
import { environment } from 'src/environments/environment';
import { GlobalErrorHandlerService } from './shared/services/global-error-handler.service';
import { PairedRegressionAnalysisComponent } from './pages/paired-regression-analysis/paired-regression-analysis.component';
import { DiversionScenarioComponent } from './pages/diversion-scenario/diversion-scenario.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CustomPageListComponent } from './pages/custom-page-list/custom-page-list.component';
import { CustomPageDetailComponent } from './pages/custom-page-detail/custom-page-detail.component';
import { CustomPageCreateComponent } from './pages/custom-page-create/custom-page-create.component';
import { CustomPageEditPropertiesComponent } from './pages/custom-page-edit-properties/custom-page-edit-properties.component';
import { ApiModule, Configuration } from './shared/generated';
import { ModuleRegistry } from 'ag-grid-community';
import { AllCommunityModule } from 'ag-grid-community';
import { AuthClientConfig, authHttpInterceptorFn, AuthModule, provideAuth0 } from "@auth0/auth0-angular";
import { getAuthConfig } from './auth-config';

export function init_app(authClientConfig: AuthClientConfig) {
  return () => {
    authClientConfig.set(getAuthConfig());
    ModuleRegistry.registerModules([AllCommunityModule]);
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeIndexComponent,
    UserListComponent,
    UserInviteComponent,
    UserDetailComponent,
    UserEditComponent,
    WatershedDetailComponent,
    LoginCallbackComponent,
    HelpComponent,
    DisclaimerComponent,
    FieldDefinitionListComponent,
    FieldDefinitionEditComponent,
    TimeSeriesAnalysisComponent,
    PairedRegressionAnalysisComponent,
    DiversionScenarioComponent,
    CustomPageListComponent,
    CustomPageDetailComponent,
    CustomPageCreateComponent,
    CustomPageEditPropertiesComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    NgbModule,
    RouterModule,
    SharedModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    AgGridModule,
    SelectDropDownModule,
    NgSelectModule,
    ApiModule.forRoot(() => {
      return new Configuration({
        basePath: `${environment.mainAppApiUrl}`,
      });
    })
  ],
  providers: [    { provide: APP_INITIALIZER, useFactory: init_app, deps: [AuthClientConfig], multi: true },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService
    },
    DecimalPipe, CurrencyPipe, DatePipe,
    importProvidersFrom(AuthModule.forRoot()),
    provideAuth0(),
    provideHttpClient(withXhr(), withInterceptors([authHttpInterceptorFn]))
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
