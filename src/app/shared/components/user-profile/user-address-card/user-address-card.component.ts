import {Component, Input} from '@angular/core';
import { ModalService } from '../../../services/modal.service';
import { CommonModule } from '@angular/common';
import { InputFieldComponent } from '../../form/input/input-field.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { LabelComponent } from '../../form/label/label.component';
import { ModalComponent } from '../../ui/modal/modal.component';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthManagementService} from "../../../../core/services/auth/auth-managment.service";
import {AuthService} from "../../../../core/services/auth/auth.service";

interface Address {
  country: string;
  shop_adresse: string;
  postalCode: string;
  taxId: string;
}

@Component({
  selector: 'app-user-address-card',
    imports: [
        CommonModule,
        InputFieldComponent,
        ButtonComponent,
        LabelComponent,
        ModalComponent,
        FormsModule,
        ReactiveFormsModule,
    ],
  templateUrl: './user-address-card.component.html',
  styles: ``,
  standalone: true
})
export class UserAddressCardComponent {

  constructor(
      public modal: ModalService,
      private authManagementService: AuthManagementService,
      private authService: AuthService,
      private fb: FormBuilder,
  ) {}

  isOpen = false;
  isLoading = false;

  @Input() address: Address = {
    country: '',
    shop_adresse: '',
    postalCode: '',
    taxId: '',
  };

  // Formulaire réactif pour l'adresse
  addressForm!: FormGroup;

  ngOnInit() {
    this.initializeForm();
  }

  openModal() {
    this.isOpen = true;
    this.patchFormValues();
  }

  closeModal() {
    this.isOpen = false;
  }

  /**
   * Initialiser le formulaire
   */
  private initializeForm() {
    this.addressForm = this.fb.group({
      country: [this.address.country || '', [Validators.required]],
      shop_adresse: [this.address.shop_adresse || '', [Validators.required]],
      postalCode: [this.address.postalCode || ''],
      taxId: [this.address.taxId || '']
    });
  }

  /**
   * Mettre à jour les valeurs du formulaire
   */
  private patchFormValues() {
    if (this.addressForm) {
      this.addressForm.patchValue({
        country: this.address.country || '',
        shop_adresse: this.address.shop_adresse || '',
        postalCode: this.address.postalCode || '',
        taxId: this.address.taxId || ''
      });
    }
  }

  /**
   * Gérer la sauvegarde
   */
  async handleSave() {
    console.log('Sauvegarde de l\'adresse...');

    if (this.addressForm.invalid) {
      console.error('Formulaire d\'adresse invalide');
      return;
    }

    this.isLoading = true;

    try {
      const formData = this.addressForm.value;
      console.log('Données d\'adresse à sauvegarder:', formData);

      // Préparer les données pour public.users
      const updateData: any = {
        country: formData.country,
        shop_adresse: formData.shop_adresse,  // Nom de colonne snake_case
        postal_code: formData.postalCode,
        tax_id: formData.taxId
      };

      // Nettoyer les valeurs undefined
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === '') {
          delete updateData[key];
        }
      });

      // 1. Mettre à jour public.users via le service existant
      const { success, error } = await this.authManagementService.updateUserProfile(updateData);

      if (error) {
        console.error('Erreur lors de la mise à jour de l\'adresse:', error);
        return;
      }

      // 2. Mettre à jour aussi les métadonnées auth pour cohérence
      try {
        const { user } = await this.authService.getCurrentUser();

        if (user) {
          const metadataUpdate = {
            country: formData.country,
            shop_adresse: formData.shop_adresse,
            postal_code: formData.postalCode,
            tax_id: formData.taxId
          };

          // Utiliser la méthode existante updateUserMetadata
          await this.authService.updateUserMetadata(metadataUpdate);
        }
      } catch (metadataError) {
        console.warn('Erreur non critique sur métadonnées:', metadataError);
      }

      // 3. Mettre à jour localement
      this.address = {
        country: formData.country,
        shop_adresse: formData.shop_adresse,
        postalCode: formData.postalCode,
        taxId: formData.taxId
      };

      console.log('✅ Adresse sauvegardée avec succès!');
      this.closeModal();

    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'adresse:', error);
    } finally {
      this.isLoading = false;
    }
  }
}














