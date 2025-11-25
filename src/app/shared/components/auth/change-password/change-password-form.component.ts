import { CommonModule } from '@angular/common';
import {Component, OnInit} from '@angular/core';
import { LabelComponent } from '../../form/label/label.component';
import { CheckboxComponent } from '../../form/input/checkbox.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PhoneInputComponent } from "../../form/group-input/phone-input/phone-input.component";
import { AuthManagementService } from "../../../../core/services/auth/auth-managment.service";

@Component({
  selector: 'app-change-password-form',
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
  templateUrl: './change-password-form.component.html',
  styles: ``,

})
export class ChangePasswordFormComponent implements OnInit {
  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Champs du formulaire
  newPassword = '';
  confirmPassword = '';

  constructor(
      private authManagement: AuthManagementService,
      private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier si l'utilisateur est arrivé via un lien de récupération
    if (!this.authManagement.isRecoverySession()) {
      this.router.navigate(['/login']);
      return;
    }
  }

  toggleNewPasswordVisibility() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // Validation du formulaire
  isFormValid(): boolean {
    return !!this.newPassword &&
        !!this.confirmPassword &&
        this.newPassword === this.confirmPassword &&
        this.newPassword.length >= 8;
  }

  async onChangePassword() {
    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.isLoading = true;

    try {
      const result = await this.authManagement.updatePassword(this.newPassword);

      if (result.success) {
        this.successMessage = 'Mot de passe mis à jour avec succès ! Redirection...';

        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          this.router.navigate(['/login'], {
            queryParams: { passwordUpdated: 'true' }
          });
        }, 2000);

      } else {
        this.errorMessage = result.error || 'Erreur lors de la mise à jour du mot de passe';
      }
    } catch (error) {
      this.errorMessage = 'Une erreur est survenue lors de la mise à jour du mot de passe';
      console.error('Erreur change password:', error);
    } finally {
      this.isLoading = false;
    }
  }
}