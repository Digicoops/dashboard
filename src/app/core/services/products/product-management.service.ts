// services/product-management.service.ts
import { Injectable } from '@angular/core';
import {AgriculturalProduct, ProductService} from "./product.service";
import { CloudflareService } from '../cloudflare/cloudflare.service';


export interface ProductFormData {
    product_name: string;
    category: string;
    assigned_user_id: string;
    quality: string;
    total_weight: number;
    unit_weight: number;
    unit: string;
    description?: string;
    regular_price: number;
    price_unit: string;
    harvest_date?: string;
    availability_status: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductManagementService {

    constructor(
        private productService: ProductService,
        private cloudflareService: CloudflareService
    ) {}

    /**
     * Créer un produit complet avec images
     */
    async createCompleteProduct(
        formData: ProductFormData,
        mainImageFile?: File,
        variantImageFiles: File[] = []
    ): Promise<AgriculturalProduct> {
        try {
            // 1. Calculer les quantités
            const totalQuantity = Math.floor(formData.total_weight / formData.unit_weight);
            const stockQuantity = totalQuantity;

            // 2. Créer le produit de base
            const productData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'> = {
                ...formData,
                total_quantity: totalQuantity,
                stock_quantity: stockQuantity,
                status: 'draft'
            };

            const product = await this.productService.createProduct(productData);

            // 3. Upload des images si fournies
            if (mainImageFile) {
                await this.productService.uploadMainImage(product.id!, mainImageFile);
            }

            if (variantImageFiles.length > 0) {
                await this.productService.uploadVariantImages(product.id!, variantImageFiles);
            }

            // 4. Récupérer le produit final
            return await this.productService.getProductById(product.id!);
        } catch (error) {
            console.error('Erreur création produit complet:', error);
            throw error;
        }
    }

    /**
     * Publier un produit
     */
    async publishProduct(productId: string): Promise<AgriculturalProduct> {
        // Validation avant publication
        const product = await this.productService.getProductById(productId);

        const validationErrors = this.validateProductForPublishing(product);
        if (validationErrors.length > 0) {
            throw new Error(`Produit non valide: ${validationErrors.join(', ')}`);
        }

        return await this.productService.updateProduct(productId, {
            status: 'published',
            availability_status: 'disponible'
        });
    }

    /**
     * Mettre à jour les stocks
     */
    async updateStock(productId: string, newStock: number): Promise<AgriculturalProduct> {
        const product = await this.productService.getProductById(productId);

        if (newStock > product.total_quantity) {
            throw new Error('Le stock ne peut pas dépasser la quantité totale');
        }

        // Mettre à jour le statut de disponibilité
        let availabilityStatus = product.availability_status;
        if (newStock === 0) {
            availabilityStatus = 'rupture';
        } else if (newStock < 10) { // Seuil arbitraire
            availabilityStatus = 'limite';
        } else {
            availabilityStatus = 'disponible';
        }

        return await this.productService.updateProduct(productId, {
            stock_quantity: newStock,
            availability_status: availabilityStatus
        });
    }

    /**
     * Gérer les promotions
     */
    async managePromotion(
        productId: string,
        isEnabled: boolean,
        promoData?: { price: number; startDate: string; endDate: string }
    ): Promise<AgriculturalProduct> {
        const updates: any = { is_promotion_enabled: isEnabled };

        if (isEnabled && promoData) {
            updates.promo_price = promoData.price;
            updates.promo_start_date = promoData.startDate;
            updates.promo_end_date = promoData.endDate;
        } else {
            updates.promo_price = null;
            updates.promo_start_date = null;
            updates.promo_end_date = null;
            updates.discount_percentage = null;
        }

        return await this.productService.updateProduct(productId, updates);
    }

    /**
     * Valider un produit pour publication
     */
    /**
     * Valider un produit pour publication
     */
    private validateProductForPublishing(product: AgriculturalProduct): string[] {
        const errors: string[] = [];

        if (!product.product_name) errors.push('Nom du produit requis');
        if (!product.assigned_user_id) errors.push('Utilisateur assigné requis');
        if (product.total_quantity <= 0) errors.push('Quantité totale invalide');
        if (product.regular_price <= 0) errors.push('Prix régulier invalide');
        if (!product.main_image) errors.push('Image principale requise');

        if (product.is_promotion_enabled) {
            if (!product.promo_price || product.promo_price <= 0) errors.push('Prix promotionnel invalide');
            if (!product.promo_start_date || !product.promo_end_date) errors.push('Dates de promotion requises');

            // Vérification sécurisée des dates
            if (product.promo_start_date && product.promo_end_date) {
                const startDate = new Date(product.promo_start_date);
                const endDate = new Date(product.promo_end_date);

                if (startDate > endDate) errors.push('Dates de promotion invalides');
            }
        }

        return errors;
    }

    /**
     * Obtenir les statistiques des produits
     */
    async getProductStats(userId?: string): Promise<{
        total: number;
        published: number;
        draft: number;
        outOfStock: number;
        onPromotion: number;
    }> {
        const products = await this.productService.getProducts({ userId });

        return {
            total: products.length,
            published: products.filter(p => p.status === 'published').length,
            draft: products.filter(p => p.status === 'draft').length,
            outOfStock: products.filter(p => p.availability_status === 'rupture').length,
            onPromotion: products.filter(p => p.is_promotion_enabled).length
        };
    }

    /**
     * Dupliquer un produit
     */

    async duplicateProduct(productId: string): Promise<AgriculturalProduct> {
        const original = await this.productService.getProductById(productId);

        // Créer un nouvel objet sans les propriétés à exclure
        const { id, created_at, updated_at, ...productData } = original;

        const duplicateData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'> = {
            ...productData,
            product_name: `${original.product_name} (Copie)`,
            stock_quantity: 0,
            status: 'draft',
            main_image: undefined, // Ne pas dupliquer les images
            variant_images: []
        };

        return await this.productService.createProduct(duplicateData);
    }
}