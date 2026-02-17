import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';
import { CookieService } from 'ngx-cookie-service';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './shared/interceptors/auth-interceptor';
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
import { CreateUserCallbackComponent } from './pages/create-user-callback/create-user-callback.component';
import { DisclaimerComponent } from './pages/disclaimer/disclaimer.component';
import { AppInitService } from './app.init';
import { FieldDefinitionListComponent } from './pages/field-definition-list/field-definition-list.component';
import { FieldDefinitionEditComponent } from './pages/field-definition-edit/field-definition-edit.component';
import { TimeSeriesAnalysisComponent } from './pages/time-series-analysis/time-series-analysis.component';
import { environment } from 'src/environments/environment';
import { GlobalErrorHandlerService } from './shared/services/global-error-handler.service';
import { PairedRegressionAnalysisComponent } from './pages/paired-regression-analysis/paired-regression-analysis.component';
import { DiversionScenarioComponent } from './pages/diversion-scenario/diversion-scenario.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { CookieStorageService } from './shared/services/cookies/cookie-storage.service';
import { CustomPageListComponent } from './pages/custom-page-list/custom-page-list.component';
import { CustomPageDetailComponent } from './pages/custom-page-detail/custom-page-detail.component';
import { CustomPageCreateComponent } from './pages/custom-page-create/custom-page-create.component';
import { CustomPageEditPropertiesComponent } from './pages/custom-page-edit-properties/custom-page-edit-properties.component';
import { ApiModule, Configuration } from './shared/generated';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';


export function init_app(appLoadService: AppInitService) {
  return () => appLoadService.init().then(() => {
  });
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
    CreateUserCallbackComponent,
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
    OAuthModule.forRoot(),
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
  providers: [
    CookieService,
    AppInitService,
    { provide: APP_INITIALIZER, useFactory: init_app, deps: [AppInitService], multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandlerService
    },
    DecimalPipe, CurrencyPipe, DatePipe,
    {
      provide: OAuthStorage,
      useClass: CookieStorageService
    },
    providePrimeNG({
      theme: { preset: Lara }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
