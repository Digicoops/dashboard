import { Component, Input, OnInit } from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { CommonModule } from '@angular/common';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { AuthManagementService } from "../../../../core/services/auth/auth-managment.service";
import { AuthService } from "../../../../core/services/auth/auth.service";

interface UserProfile {
  firstName: string;
  lastName: string;
  role: string;
  shop_name: string;
  avatar: string;
  social: {
    facebook: string;
    x: string;
    linkedin: string;
    instagram: string;
  };
  email: string;
  phone: string;
  bio: string;
  shopName?: string;
  userType?: string;
}

@Component({
  selector: 'app-user-info-card',
  imports: [
    CommonModule,
    InputFieldComponent,
    ButtonComponent,
    LabelComponent,
    ModalComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './user-info-card.component.html',
  styles: ``,
  standalone: true
})
export class UserInfoCardComponent implements OnInit {

  constructor(
      public modal: ModalService,
      private authManagementService: AuthManagementService,
      private authService: AuthService,
      private fb: FormBuilder,
  ) {}

  isOpen = false;
  isLoading = false;

  private _user!: UserProfile;

  // Setter pour réagir aux changements de l'input
  @Input()
  set user(value: UserProfile) {
    console.log('User reçu:', value);
    this._user = value;

    // Si le formulaire existe déjà, mettre à jour ses valeurs
    if (this.userForm) {
      this.updateFormWithUserData();
    }
  }

  get user(): UserProfile {
    return this._user;
  }

  // Formulaire réactif
  userForm!: FormGroup;

  ngOnInit() {
    // Initialiser le formulaire une seule fois
    this.initializeForm();

    // Mettre à jour les valeurs si user est déjà disponible
    if (this._user) {
      this.updateFormWithUserData();
    }
  }

  openModal() {
    this.isOpen = true;

    // S'assurer que les données sont à jour quand le modal s'ouvre
    if (this.userForm && this._user) {
      this.updateFormWithUserData();
    }
  }

  closeModal() {
    this.isOpen = false;
  }

  /**
   * Initialiser la structure du formulaire
   */
  private initializeForm() {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      bio: [''],
      social_facebook: [''],
      social_x: [''],
      social_linkedin: [''],
      social_instagram: ['']
    });

    console.log('Formulaire initialisé');
  }

  /**
   * Mettre à jour les valeurs du formulaire avec les données utilisateur
   */
  private updateFormWithUserData() {
    if (!this._user || !this.userForm) {
      console.log('Données ou formulaire non disponibles');
      return;
    }

    this.userForm.patchValue({
      firstName: this._user.firstName || '',
      lastName: this._user.lastName || '',
      email: this._user.email || '',
      phone: this._user.phone || '',
      bio: this._user.bio || '',
      social_facebook: this._user.social?.facebook || '',
      social_x: this._user.social?.x || '',
      social_linkedin: this._user.social?.linkedin || '',
      social_instagram: this._user.social?.instagram || ''
    }, { emitEvent: false });

    console.log('Formulaire mis à jour avec:', {
      firstName: this._user.firstName,
      lastName: this._user.lastName,
      email: this._user.email
    });
  }

  /**
   * Gérer la sauvegarde des modifications
   */
  async handleSave() {
    console.log('Bouton Save cliqué');

    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.markFormGroupTouched(this.userForm);

    if (this.userForm.invalid) {
      console.error('Formulaire invalide');
      this.logFormErrors();
      return;
    }

    this.isLoading = true;
    console.log('Début de la sauvegarde...');

    try {
      const formData = this.userForm.value;
      console.log('Données du formulaire:', formData);

      // Préparer les données pour la table users
      const profileUpdateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio
      };

      // Ajouter les réseaux sociaux
      if (formData.social_facebook) profileUpdateData.social_facebook = formData.social_facebook;
      if (formData.social_x) profileUpdateData.social_x = formData.social_x;
      if (formData.social_linkedin) profileUpdateData.social_linkedin = formData.social_linkedin;
      if (formData.social_instagram) profileUpdateData.social_instagram = formData.social_instagram;

      console.log('Données à envoyer:', profileUpdateData);

      // 1. Mettre à jour le profil
      const { success: profileSuccess, error: profileError } =
          await this.authManagementService.updateUserProfile(profileUpdateData);

      console.log('Résultat updateUserProfile:', { success: profileSuccess, error: profileError });

      if (profileError) {
        console.error('Erreur API:', profileError);
        return;
      }

      // 2. Mettre à jour les métadonnées dans Supabase Auth
      try {
        const { user } = await this.authService.getCurrentUser();

        if (user) {
          const metadataUpdateData = {
            bio: formData.bio,
            social_facebook: formData.social_facebook || '',
            social_x: formData.social_x || '',
            social_linkedin: formData.social_linkedin || '',
            social_instagram: formData.social_instagram || ''
          };

          const currentMetadata = user.user_metadata || {};
          const updatedMetadata = { ...currentMetadata, ...metadataUpdateData };

          // Vérifier si la méthode existe
          if (this.authManagementService.updateUserMetadata) {
            const { error: metadataError } =
                await this.authManagementService.updateUserMetadata(updatedMetadata);

            if (metadataError) {
              console.warn('Avertissement métadonnées:', metadataError);
            }
          }
        }
      } catch (metadataError) {
        console.warn('Erreur non critique sur métadonnées:', metadataError);
      }

      // 3. Mettre à jour localement
      this.updateLocalUserData(formData);

      console.log('✅ Sauvegarde réussie!');
      this.closeModal();

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
    } finally {
      this.isLoading = false;
      console.log('Chargement terminé');
    }
  }

  /**
   * Mettre à jour les données locales
   */
  private updateLocalUserData(formData: any) {
    if (!this._user) return;

    this._user = {
      ...this._user,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio,
      social: {
        facebook: formData.social_facebook || this._user.social?.facebook || '',
        x: formData.social_x || this._user.social?.x || '',
        linkedin: formData.social_linkedin || this._user.social?.linkedin || '',
        instagram: formData.social_instagram || this._user.social?.instagram || ''
      }
    };
  }

  /**
   * Marquer tous les champs du formulaire comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Afficher les erreurs du formulaire dans la console
   */
  private logFormErrors() {
    const errors: any = {};
    Object.keys(this.userForm.controls).forEach(key => {
      const control = this.userForm.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }
    });
    console.log('Erreurs de validation:', errors);
  }
}