import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import {Router, RouterModule} from '@angular/router';
import { FormsModule } from '@angular/forms';
import {PhoneInputComponent} from "../../form/group-input/phone-input/phone-input.component";
import {AuthManagementService} from "../../../../core/services/auth/auth-managment.service";
import {LoginData} from "../../../../core/services/auth/auth.service";

@Component({
  selector: 'app-signin-form',
  imports: [
    CommonModule,
    LabelComponent,
    CheckboxComponent,
    ButtonComponent,
    InputFieldComponent,
    RouterModule,
    FormsModule,
    PhoneInputComponent,
  ],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent {
  showPassword = false;
  isChecked = false;

  email = '';
  password = '';
  phone = '';
  isLoading = false;
  errorMessage = '';

  countries = [
    { code: 'SN', label: '+221' },
  ];

  constructor(
      private authManagement: AuthManagementService,
      private router: Router
  ) {}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  handlePhoneNumberChange(phoneNumber: string) {
    console.log('Updated phone number:', phoneNumber);
    this.phone = phoneNumber;
  }

  async onSignIn() {
    // Reset error message
    this.errorMessage = '';

    // Validation
    if (!this.email && !this.phone) {
      this.errorMessage = 'Veuillez entrer un email ou un numéro de téléphone';
      return;
    }

    if (!this.password) {
      this.errorMessage = 'Veuillez entrer un mot de passe';
      return;
    }

    this.isLoading = true;

    try {
      let result: { success: boolean; error?: string };

      if (this.phone) {
        // Login avec téléphone
        result = await this.authManagement.login({email: this.phone, password:  this.password});
      } else {
        // Login avec email
        const loginData: LoginData = {
          email: this.email,
          password: this.password
        };
        result = await this.authManagement.login(loginData);
      }

      if (result.success) {
        console.log('Connexion réussie!');
        // Redirection vers la page d'accueil ou dashboard
        this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = result.error || 'Erreur de connexion';
      }
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la connexion';
      console.error('Erreur connexion:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Méthode pour connexion Google (si implémentée plus tard)
  onGoogleSignIn() {
    console.log('Google sign in clicked');
    // Implémentation OAuth Google à ajouter
  }
}