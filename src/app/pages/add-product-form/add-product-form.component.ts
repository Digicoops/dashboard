import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {InputFieldComponent} from "../../shared/components/form/input/input-field.component";
import {LabelComponent} from "../../shared/components/form/label/label.component";
import {SelectComponent} from "../../shared/components/form/select/select.component";
import {TextAreaComponent} from "../../shared/components/form/input/text-area.component";
import {ButtonComponent} from "../../shared/components/ui/button/button.component";
import {PageBreadcrumbComponent} from "../../shared/components/common/page-breadcrumb/page-breadcrumb.component";
import {
  UserAddressCardComponent
} from "../../shared/components/user-profile/user-address-card/user-address-card.component";
import {UserInfoCardComponent} from "../../shared/components/user-profile/user-info-card/user-info-card.component";
import {UserMetaCardComponent} from "../../shared/components/user-profile/user-meta-card/user-meta-card.component";

@Component({
  selector: 'app-add-product-form',
  imports: [
    CommonModule,
    LabelComponent,
    InputFieldComponent,
    SelectComponent,
    TextAreaComponent,
    ButtonComponent,
    PageBreadcrumbComponent,
    UserAddressCardComponent,
    UserInfoCardComponent,
    UserMetaCardComponent
  ],
  templateUrl: './add-product-form.component.html',
  styles: ``
})
export class AddProductFormComponent {

  categories = [
    { value: 'fruits', label: 'Fruits' },
    { value: 'legumes', label: 'Légumes' },
    { value: 'cereales', label: 'Céréales' },
    { value: 'viandes', label: 'Viandes' },
    { value: 'produits-laitiers', label: 'Produits laitiers' },
    { value: 'autres', label: 'Autres produits agricoles' }
  ];

  users = [
    { value: '1', label: 'Jean Dupont - Agriculteur' },
    { value: '2', label: 'Marie Martin - Éleveuse' },
    { value: '3', label: 'Pierre Lambert - Maraîcher' },
    { value: '4', label: 'Sophie Bernard - Viticulteur' }
  ];

  qualities = [
    { value: 'extra', label: 'Extra' },
    { value: 'premium', label: 'Premium' },
    { value: 'standard', label: 'Standard' },
    { value: 'economique', label: 'Économique' }
  ];

  units = [
    { value: 'kg', label: 'Kilogramme' },
    { value: 'panier', label: 'Panier' },
    { value: 'caisse', label: 'Caisse' },
    { value: 'sac', label: 'Sac' },
    { value: 'piece', label: 'Pièce' },
    { value: 'bouquet', label: 'Bouquet' }
  ];

  priceUnits = [
    { value: 'kg', label: 'FCFA/kg' },
    { value: 'panier', label: 'FCFA/panier' },
    { value: 'caisse', label: 'FCFA/caisse' },
    { value: 'sac', label: 'FCFA/sac' },
    { value: 'piece', label: 'FCFA/pièce' },
    { value: 'bouquet', label: 'FCFA/bouquet' }
  ];

  availability = [
    { value: 'disponible', label: 'En stock' },
    { value: 'rupture', label: 'Rupture de stock' },
    { value: 'limite', label: 'Stock limité' },
    { value: 'precommande', label: 'Pré-commande' }
  ];

  // Propriétés pour la gestion des quantités
  stockQuantity: number = 1;
  totalQuantity: number = 0;
  totalWeight: number = 0;
  unitWeight: number = 0;
  assignedUserId: string = '';

  // Propriétés pour la gestion des prix et promotions
  isPromotionEnabled: boolean = false;
  regularPrice: number = 0;
  promoPrice: number = 0;
  promoStartDate: string = '';
  promoEndDate: string = '';
  harvestDate: string = '';

  // Gestion des images
  mainImage: string | null = null;
  variantImages: { url: string; description: string }[] = [];

  // Méthodes pour la gestion des sélections
  handleSelectChange(value: string) {
    console.log('Valeur sélectionnée:', value);
  }

  handleUserAssignment(userId: string) {
    this.assignedUserId = userId;
    console.log('Produit attribué à l\'utilisateur:', userId);
  }

  // Méthodes pour la gestion des quantités
  onTotalWeightChange(value: any) {
    this.totalWeight = parseFloat(value) || 0;
    this.calculateQuantities();
  }

  onUnitWeightChange(value: any) {
    this.unitWeight = parseFloat(value) || 0;
    this.calculateQuantities();
  }

  calculateQuantities() {
    if (this.unitWeight > 0 && this.totalWeight > 0) {
      this.totalQuantity = Math.floor(this.totalWeight / this.unitWeight);
      if (this.stockQuantity > this.totalQuantity) {
        this.stockQuantity = this.totalQuantity;
      }
    } else {
      this.totalQuantity = 0;
    }
  }

  incrementStock() {
    if (this.stockQuantity < this.totalQuantity) {
      this.stockQuantity++;
    }
  }

  decrementStock() {
    if (this.stockQuantity > 0) {
      this.stockQuantity--;
    }
  }

  updateStockQuantity(value: any) {
    const newStock = parseInt(value) || 0;
    this.stockQuantity = Math.min(Math.max(0, newStock), this.totalQuantity);
  }

  // Méthodes pour la gestion des prix et promotions
  onPriceChange(value: any) {
    this.regularPrice = parseFloat(value) || 0;
  }

  onPromotionToggle(event: any) {
    this.isPromotionEnabled = event.target.checked;
    if (!this.isPromotionEnabled) {
      // Réinitialiser les valeurs de promotion si désactivée
      this.promoPrice = 0;
      this.promoStartDate = '';
      this.promoEndDate = '';
    }
  }

  onPromoPriceChange(value: any) {
    this.promoPrice = parseFloat(value) || 0;
  }

  onPromoStartDateChange(value: any) {
    this.promoStartDate = value;
  }

  onPromoEndDateChange(value: any) {
    this.promoEndDate = value;
  }

  onHarvestDateChange(value: any) {
    this.harvestDate = value;
  }

  calculateDiscountPercentage(): number {
    if (this.regularPrice > 0 && this.promoPrice > 0 && this.promoPrice < this.regularPrice) {
      return Math.round(((this.regularPrice - this.promoPrice) / this.regularPrice) * 100);
    }
    return 0;
  }

  isPromotionActive(): boolean {
    if (!this.promoStartDate || !this.promoEndDate) {
      return false;
    }

    const today = new Date();
    const startDate = new Date(this.promoStartDate);
    const endDate = new Date(this.promoEndDate);

    return today >= startDate && today <= endDate;
  }

  // Méthodes pour la gestion des images principales
  onMainImageChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.mainImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeMainImage() {
    this.mainImage = null;
  }

  // Méthodes pour la gestion des images variantes
  onVariantImagesChange(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.variantImages.push({
          url: e.target.result,
          description: ''
        });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; // Reset input
  }

  removeVariantImage(index: number) {
    this.variantImages.splice(index, 1);
  }

  updateVariantImageDescription(index: number, description: any) {
    this.variantImages[index].description = description;
  }

  // Méthodes pour les actions
  onDraft() {
    const productData = {
      assignedUser: this.assignedUserId,
      stock: this.stockQuantity,
      totalQuantity: this.totalQuantity,
      totalWeight: this.totalWeight,
      unitWeight: this.unitWeight,
      regularPrice: this.regularPrice,
      promotion: this.isPromotionEnabled ? {
        promoPrice: this.promoPrice,
        startDate: this.promoStartDate,
        endDate: this.promoEndDate,
        discount: this.calculateDiscountPercentage(),
        isActive: this.isPromotionActive()
      } : null,
      harvestDate: this.harvestDate,
      mainImage: this.mainImage ? 'présente' : 'absente',
      variantImagesCount: this.variantImages.length,
      variantImages: this.variantImages
    };

    console.log('Produit sauvegardé comme brouillon', productData);

    // Ici vous pouvez ajouter l'appel API pour sauvegarder le brouillon
    // this.productService.saveDraft(productData).subscribe(...);
  }

  onPublish() {
    const productData = {
      assignedUser: this.assignedUserId,
      stock: this.stockQuantity,
      totalQuantity: this.totalQuantity,
      totalWeight: this.totalWeight,
      unitWeight: this.unitWeight,
      regularPrice: this.regularPrice,
      promotion: this.isPromotionEnabled ? {
        promoPrice: this.promoPrice,
        startDate: this.promoStartDate,
        endDate: this.promoEndDate,
        discount: this.calculateDiscountPercentage(),
        isActive: this.isPromotionActive()
      } : null,
      harvestDate: this.harvestDate,
      mainImage: this.mainImage,
      variantImages: this.variantImages,
      publishedAt: new Date().toISOString()
    };

    console.log('Produit publié', productData);

    // Validation des données avant publication
    if (!this.validateProductData()) {
      console.error('Données du produit invalides');
      return;
    }

    // Ici vous pouvez ajouter l'appel API pour publier le produit
    // this.productService.publish(productData).subscribe(...);
  }

  // Méthode de validation des données
  private validateProductData(): boolean {
    if (!this.assignedUserId) {
      console.error('Veuillez attribuer le produit à un utilisateur');
      return false;
    }

    if (this.totalQuantity <= 0) {
      console.error('La quantité totale doit être supérieure à 0');
      return false;
    }

    if (this.regularPrice <= 0) {
      console.error('Le prix régulier doit être supérieur à 0');
      return false;
    }

    if (this.isPromotionEnabled) {
      if (this.promoPrice <= 0) {
        console.error('Le prix promotionnel doit être supérieur à 0');
        return false;
      }

      if (!this.promoStartDate || !this.promoEndDate) {
        console.error('Veuillez spécifier les dates de promotion');
        return false;
      }

      if (new Date(this.promoStartDate) > new Date(this.promoEndDate)) {
        console.error('La date de fin de promotion doit être après la date de début');
        return false;
      }

      if (this.promoPrice >= this.regularPrice) {
        console.error('Le prix promotionnel doit être inférieur au prix régulier');
        return false;
      }
    }

    return true;
  }

  // Méthode utilitaire pour réinitialiser le formulaire
  resetForm() {
    this.stockQuantity = 1;
    this.totalQuantity = 0;
    this.totalWeight = 0;
    this.unitWeight = 0;
    this.assignedUserId = '';
    this.regularPrice = 0;
    this.isPromotionEnabled = false;
    this.promoPrice = 0;
    this.promoStartDate = '';
    this.promoEndDate = '';
    this.harvestDate = '';
    this.mainImage = null;
    this.variantImages = [];
  }
}