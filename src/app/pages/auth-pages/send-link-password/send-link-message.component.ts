import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import { SigninFormComponent } from '../../../shared/components/auth/signin-form/signin-form.component';
import {
  SendLinkMessageFormComponent
} from "../../../shared/components/auth/send-link-password/send-link-message-form.component";


@Component({
  selector: 'app-send-link-message',
  imports: [
    AuthPageLayoutComponent,
    SigninFormComponent,
      SendLinkMessageFormComponent
  ],
  templateUrl: './send-link-message.component.html',
  styles: ``,
  standalone: true
})
export class SendLinkMessageComponent {}
