import { Component } from '@angular/core';
import { AuthPageLayoutComponent } from '../../../shared/layout/auth-page-layout/auth-page-layout.component';
import {
  ComingSoonComponentShared
} from "../../../shared/components/auth/coming-soon-shared/coming-soon-shared.component";
import {SigninFormComponent} from "../../../shared/components/auth/signin-form/signin-form.component";

@Component({
  selector: 'app-coming-soon',
  imports: [
    AuthPageLayoutComponent,
    ComingSoonComponentShared
  ],
  templateUrl: './coming-soon.component.html',
  standalone: true
})
export class ComingSoonComponent {

}
