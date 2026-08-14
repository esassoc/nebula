import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotFoundComponent, SubscriptionInsufficientComponent } from './shared/pages';
import { ManagerOnlyGuard } from './shared/guards/unauthenticated-access/manager-only-guard';
import { AcknowledgedDisclaimerGuard } from './shared/guards/acknowledged-disclaimer-guard';
import { UserListComponent } from './pages/user-list/user-list.component';
import { HomeIndexComponent } from './pages/home/home-index/home-index.component';
import { UserDetailComponent } from './pages/user-detail/user-detail.component';
import { UserInviteComponent } from './pages/user-invite/user-invite.component';
import { UserEditComponent } from './pages/user-edit/user-edit.component';
import { LoginCallbackComponent } from './pages/login-callback/login-callback.component';
import { HelpComponent } from './pages/help/help.component';
import { DisclaimerComponent } from './pages/disclaimer/disclaimer.component';
import { WatershedDetailComponent } from './pages/watershed-detail/watershed-detail.component';
import { FieldDefinitionListComponent } from './pages/field-definition-list/field-definition-list.component';
import { FieldDefinitionEditComponent } from './pages/field-definition-edit/field-definition-edit.component';
import { TimeSeriesAnalysisComponent } from './pages/time-series-analysis/time-series-analysis.component';
import { PairedRegressionAnalysisComponent } from './pages/paired-regression-analysis/paired-regression-analysis.component';
import { DiversionScenarioComponent } from './pages/diversion-scenario/diversion-scenario.component';
import { DataExplorerGuard } from './shared/guards/unauthenticated-access/data-explorer-guard';
import { CustomPageListComponent } from './pages/custom-page-list/custom-page-list.component';
import { CustomPageCreateComponent } from './pages/custom-page-create/custom-page-create.component';
import { CustomPageEditPropertiesComponent } from './pages/custom-page-edit-properties/custom-page-edit-properties.component';
import { CustomPageDetailComponent } from './pages/custom-page-detail/custom-page-detail.component';
import { CustomPageAccessGuard } from './shared/guards/custom-page-access-guard';
import { authGuardFn } from '@auth0/auth0-angular';

const routes: Routes = [
  { path: 'labels-and-definitions/:id', component: FieldDefinitionEditComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'labels-and-definitions', component: FieldDefinitionListComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'custom-pages', component: CustomPageListComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'custom-pages/create', component: CustomPageCreateComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'custom-pages/edit-properties/:vanity-url', component: CustomPageEditPropertiesComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'custom-pages/:vanity-url', component: CustomPageDetailComponent, canActivate: [authGuardFn, CustomPageAccessGuard, AcknowledgedDisclaimerGuard] },
  { path: 'watersheds/:id', component: WatershedDetailComponent, canActivate: [authGuardFn, DataExplorerGuard, AcknowledgedDisclaimerGuard] },
  { path: 'users', component: UserListComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'users/:id', component: UserDetailComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'users/:id/edit', component: UserEditComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'invite-user/:userID', component: UserInviteComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'invite-user', component: UserInviteComponent, canActivate: [authGuardFn, ManagerOnlyGuard, AcknowledgedDisclaimerGuard] },
  { path: 'time-series-analysis', component: TimeSeriesAnalysisComponent, canActivate: [authGuardFn, DataExplorerGuard, AcknowledgedDisclaimerGuard] },
  { path: 'paired-regression-analysis', component: PairedRegressionAnalysisComponent, canActivate: [authGuardFn, DataExplorerGuard, AcknowledgedDisclaimerGuard] },
  { path: 'diversion-scenario', component: DiversionScenarioComponent, canActivate: [authGuardFn, DataExplorerGuard, AcknowledgedDisclaimerGuard] },
  { path: 'disclaimer', component: DisclaimerComponent },
  { path: 'disclaimer/:forced', component: DisclaimerComponent },
  { path: 'help', component: HelpComponent },
  { path: 'not-found', component: NotFoundComponent },
  { path: 'subscription-insufficient', component: SubscriptionInsufficientComponent },
  { path: 'signin-oidc', component: LoginCallbackComponent },
  { path: '', component: HomeIndexComponent },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
