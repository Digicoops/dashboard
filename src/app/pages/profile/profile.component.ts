import { CommonModule } from '@angular/common';
import {Component, inject} from '@angular/core';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { UserMetaCardComponent } from '../../shared/components/user-profile/user-meta-card/user-meta-card.component';
import { UserInfoCardComponent } from '../../shared/components/user-profile/user-info-card/user-info-card.component';
import { UserAddressCardComponent } from '../../shared/components/user-profile/user-address-card/user-address-card.component';
import {AuthService} from "../../core/services/auth/auth.service";
import {AuthManagementService} from "../../core/services/auth/auth-managment.service";

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    PageBreadcrumbComponent,
    UserMetaCardComponent,
    UserInfoCardComponent,
    UserAddressCardComponent,
  ],
  templateUrl: './profile.component.html',
  styles: ``,
  standalone: true
})
export class ProfileComponent {

  // États du composant
  isLoading = false;
  errorMessage = '';
  currentUser: any = null;
  userProfile: any = null;
  userType: 'personal' | 'cooperative' | 'producer' | null = null;
  isCooperative = false;

  // Objet user pour app-user-meta-card
  user = {
    firstName: '',
    lastName: '',
    role: '',
    shop_name: '',
    avatar: '/images/user/owner.jpg', // Par défaut
    social: {
      facebook: 'https://www.facebook.com/PimjoHQ',
      x: 'https://x.com/PimjoHQ',
      linkedin: 'https://www.linkedin.com/company/pimjo',
      instagram: 'https://instagram.com/PimjoHQ',
    },
    email: '',
    phone: '',
    bio: '',
  };

  private authService = inject(AuthService);
  private authManagementService = inject(AuthManagementService);

  async ngOnInit() {
    await this.loadUserData();
  }


  getUserInitials(): string {
    const name = this.fullName;
    if (!name || name === 'Utilisateur') return 'U';

    const initials = name
        .split(' ')
        .map(n => n[0] || '')
        .join('')
        .toUpperCase();

    return initials || 'U';
  }

  /**
   * Charger les données de l'utilisateur connecté
   */
  private async loadUserData() {
    this.isLoading = true;
    try {
      // 1. Récupérer l'utilisateur auth de base
      const { user, error: userError } = await this.authService.getCurrentUser();

      if (userError || !user) {
        this.errorMessage = 'Aucun utilisateur connecté';
        return;
      }

      this.currentUser = user;
      console.log('Utilisateur auth:', this.currentUser);

      // 2. Récupérer le profil COMPLET depuis la base de données
      const { profile, error: profileError } = await this.authManagementService.getUserProfile();

      if (profileError) {
        console.error('Erreur récupération profil:', profileError);
        // Utilisez les métadonnées de l'utilisateur auth comme fallback
        this.userProfile = {
          first_name: user.user_metadata?.['first_name'],
          last_name: user.user_metadata?.['last_name'],
          email: user.email,
          phone: user.user_metadata?.['phone'],
          shop_name: user.user_metadata?.['shop_name'],
          profile: user.user_metadata?.['profile'] || 'personal'
        };
        console.log('Utilisation des métadonnées comme fallback:', this.userProfile);
      } else {
        this.userProfile = profile;
        console.log('Profil complet:', this.userProfile);
      }

      // 3. Déterminer le type de profil
      this.userType = this.userProfile?.profile || 'personal';
      this.isCooperative = this.userType === 'cooperative';

      // 4. Mettre à jour l'objet user pour app-user-meta-card
      this.updateUserObject();

    } catch (error) {
      console.error('Erreur loadUserData:', error);
      this.errorMessage = 'Erreur lors du chargement des données utilisateur';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Mettre à jour l'objet user pour app-user-meta-card
   */
  private updateUserObject() {
    const fullName = this.fullName;
    const nameParts = fullName.split(' ');

    this.user = {
      firstName: this.userProfile?.first_name || this.currentUser?.user_metadata?.first_name || nameParts[0] || 'Utilisateur',
      lastName: this.userProfile?.last_name || this.currentUser?.user_metadata?.last_name ||
          (nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''),
      role: this.getUserRole(),
      shop_name: this.getUserShopName(), // À adapter selon vos données
      avatar: this.getAvatarUrl(),
      social: {
        facebook: 'https://www.facebook.com/PimjoHQ',
        x: 'https://x.com/PimjoHQ',
        linkedin: 'https://www.linkedin.com/company/pimjo',
        instagram: 'https://instagram.com/PimjoHQ',
      },
      email: this.email,
      phone: this.phone,
      bio: this.getUserBio(),
    };
  }

  /**
   * Déterminer le rôle de l'utilisateur
   */
  private getUserRole(): string {
    switch (this.userType) {
      case 'cooperative':
        return 'Compte cooperative';
      case 'personal':
        return 'Compte personel';
      default:
        return 'Unknown';
    }
  }

  /**
   * Générer la bio de l'utilisateur
   */
  private getUserBio(): string {
    const role = this.getUserRole();
    if (this.shopName) {
      return `${role} - ${this.shopName}`;
    }
    return role;
  }

  /**
   * Obtenir l'URL de l'avatar
   */
  private getAvatarUrl(): string {
    // À adapter selon où vous stockez l'avatar
    return this.userProfile?.avatar_url ||
        this.currentUser?.user_metadata?.avatar_url ||
        '/images/user/owner.jpg';
  }

  /**
   * Obtenir la localisation
   */
  private getUserShopName(): string {
    // À adapter selon vos données
    return this.userProfile?.location ||
        this.currentUser?.user_metadata?.shop_name ||
        'Localisation non spécifiée';
  }

  // Getters pour accéder facilement aux informations
  get fullName(): string {
    if (this.userProfile) {
      return `${this.userProfile.first_name || ''} ${this.userProfile.last_name || ''}`.trim();
    }

    // Fallback sur les métadonnées de currentUser
    if (this.currentUser?.user_metadata) {
      return `${this.currentUser.user_metadata.first_name || ''} ${this.currentUser.user_metadata.last_name || ''}`.trim();
    }

    return 'Utilisateur';
  }

  get email(): string {
    return this.userProfile?.email || this.currentUser?.email || '';
  }

  get phone(): string {
    return this.userProfile?.phone || this.currentUser?.user_metadata?.phone || '';
  }

  get shopName(): string {
    return this.userProfile?.shop_name || this.currentUser?.user_metadata?.shop_name || '';
  }

  get profileType(): string {
    return this.userProfile?.profile || this.currentUser?.user_metadata?.profile || 'personal';
  }

  getAddress() {
    // Utiliser les données du userProfile en priorité, sinon user_metadata
    const profile = this.userProfile || {};
    const metadata = this.currentUser?.user_metadata || {};

    // Fusionner les sources de données
    const country = profile.country || metadata.country || 'Senegal';
    const city = profile.city || metadata.city || '';
    const state = profile.state || metadata.shop_adresse  || '';
    const shop_adresse_value =  metadata.shop_adresse  || '';
    const postalCode = profile.postal_code || profile.zip_code || metadata.postal_code || 'Non spécifié';
    const taxId = profile.tax_id || profile.vat_number || metadata.tax_id || 'Non spécifié';

    // Construire shop_adresse
    // let shop_adresse = '';

    // if (city && state) {
    //   shop_adresse = `${city}, ${state}, ${country}`;
    // } else if (city) {
    //   shop_adresse = `${city}, ${country}`;
    // } else if (state) {
    //   shop_adresse = `${state}, ${country}`;
    // } else {
    //   shop_adresse = country;
    // }

    return {
      country: country,
      shop_adresse: shop_adresse_value,
      postalCode: postalCode,
      taxId: taxId,
    };
  }

  // Méthode pour rafraîchir les données
  async refreshUserData() {
    await this.loadUserData();
  }
}