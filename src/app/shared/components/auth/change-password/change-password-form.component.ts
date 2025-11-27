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
import {AuthService} from "../../../../core/services/auth/auth.service";

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
  standalone: true
})
export class ChangePasswordFormComponent implements OnInit {
  showNewPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isLinkExpired = false;

  // Champs du formulaire
  newPassword = '';
  confirmPassword = '';

  constructor(
      private authManagement: AuthManagementService,
      private authService: AuthService,
      private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('ChangePasswordComponent initialized');

    // CORRECTION : Utiliser la nouvelle logique de vérification
    const isRecoverySession = this.isRecoverySession();

    if (!isRecoverySession) {
      console.log('Not a recovery session, showing error');
      this.errorMessage = 'Cette page est réservée à la réinitialisation de mot de passe via email.';
      this.isLinkExpired = true;
      return;
    }

    // IMPORTANT: Avec Supabase, il faut traiter le hash URL pour récupérer la session
    try {
      console.log('Processing Supabase recovery session...');

      // CORRECTION: Utilisez directement le retour de getSession()
      const sessionResult = await this.authService.getSession();

      if (sessionResult.error) {
        console.error('Error getting session:', sessionResult.error);
        this.errorMessage = 'Lien de réinitialisation invalide ou expiré. Veuillez redemander un nouveau lien.';
        this.isLinkExpired = true;
        return;
      }

      if (!sessionResult.session) {
        console.error('No session found');
        this.errorMessage = 'Session invalide. Veuillez redemander un lien de réinitialisation.';
        this.isLinkExpired = true;
        return;
      }

      console.log('Recovery session established successfully');

    } catch (error) {
      console.error('Error in recovery session setup:', error);
      this.errorMessage = 'Erreur lors de la validation du lien de réinitialisation. Veuillez réessayer.';
      this.isLinkExpired = true;
    }
  }

  // NOUVELLE MÉTHODE : Vérification simplifiée de la session de récupération
  private isRecoverySession(): boolean {
    // La façon la plus simple : vérifier l'URL complète
    const url = window.location.href;
    console.log('Current URL:', url);

    // Si on est sur la page update-password, c'est très probablement une tentative de récupération
    const isRecovery = url.includes('update-password');

    console.log('Is recovery session:', isRecovery);
    return isRecovery;
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

        // Déconnexion après la mise à jour du mot de passe
        await this.authManagement.logout();

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

  requestNewLink() {
    this.router.navigate(['/reset-password']);
  }

  // Méthode pour contacter le support
  contactSupport() {
    window.location.href = 'mailto:support@digicoop.com?subject=Problème de réinitialisation de mot de passe';
  }
}