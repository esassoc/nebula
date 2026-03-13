import { NgModule, ModuleWithProviders, SkipSelf, Optional } from '@angular/core';
import { Configuration } from './configuration';
import { HttpClient } from '@angular/common/http';


import { CustomPageService } from './api/custom-page.service';
import { CustomRichTextService } from './api/custom-rich-text.service';
import { FieldDefinitionService } from './api/field-definition.service';
import { MenuItemService } from './api/menu-item.service';
import { RoleService } from './api/role.service';
import { SystemInfoService } from './api/system-info.service';
import { UserService } from './api/user.service';
import { WatershedService } from './api/watershed.service';

@NgModule({
  imports:      [],
  declarations: [],
  exports:      [],
  providers: [
    CustomPageService,
    CustomRichTextService,
    FieldDefinitionService,
    MenuItemService,
    RoleService,
    SystemInfoService,
    UserService,
    WatershedService,
     ]
})
export class ApiModule {
    public static forRoot(configurationFactory: () => Configuration): ModuleWithProviders<ApiModule> {
        return {
            ngModule: ApiModule,
            providers: [ { provide: Configuration, useFactory: configurationFactory } ]
        };
    }

    constructor( @Optional() @SkipSelf() parentModule: ApiModule,
                 @Optional() http: HttpClient) {
        if (parentModule) {
            throw new Error('ApiModule is already loaded. Import in your base AppModule only.');
        }
        if (!http) {
            throw new Error('You need to import the HttpClientModule in your AppModule! \n' +
            'See also https://github.com/angular/angular/issues/20575');
        }
    }
}
