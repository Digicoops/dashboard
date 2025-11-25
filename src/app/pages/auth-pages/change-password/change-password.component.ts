import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { SigninFormComponent } from '../../../shared/components/auth/signin-form/signin-form.component';

import {
  ChangePasswordFormComponent
} from "../../../shared/components/auth/change-password/change-password-form.component";

@Component({
  selector: 'app-change-password',
  imports: [
    AuthPageLayoutComponent,
    SigninFormComponent,
    ChangePasswordFormComponent,
  ],
  templateUrl: './change-password.component.html',
  styles: ``
})
export class ChangePasswordComponent {}
