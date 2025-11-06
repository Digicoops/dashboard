import { CommonModule } from '@angular/common';
import {Component, inject} from '@angular/core';
import { ButtonComponent } from '../../ui/button/button.component';
import {  RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {AuthManagementService} from "../../../../core/services/auth/auth-managment.service";

@Component({
  selector: 'app-verified-mail',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    RouterModule,
    FormsModule,
  ],
  templateUrl: './verified-mail.component.html',
  styles: ``,

})
export class VerifiedMailComponent {
  private  autManagement = inject(AuthManagementService)


  submitEmail(email: string) {
    this.autManagement.resendConfirmationEmail(email);
  }

}