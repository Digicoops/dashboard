// services/product.service.ts
import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import {CloudflareService} from "../cloudflare/cloudflare.service";
import {environment} from "../../../../environments/environment.development";

export interface AgriculturalProduct {
    id?: string;
    created_at?: string;
    updated_at?: string;
    product_name: string;
    category: string;
    assigned_user_id: string;
    quality: string;
    total_weight: number;
    unit_weight: number;
    unit: string;
    stock_quantity: number;
    total_quantity: number;
    description?: string;
    regular_price: number;
    price_unit: string;
    harvest_date?: string;
    availability_status: string;
    is_promotion_enabled: boolean;
    promo_price?: number;
    promo_start_date?: string;
    promo_end_date?: string;
    discount_percentage?: number;
    main_image?: any;
    variant_images?: any[];
    status: 'draft' | 'published' | 'archived';
}

export interface ProductImage {
    cloudflareId: string;
    url: string;
    name: string;
    size: number;
    uploaded_at: string;
    description?: string;
    variant?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private supabase: SupabaseClient;
    constructor(private cloudflareService: CloudflareService) {
        this.supabase = createClient(
            environment.supabase.url,
            environment.supabase.key
        );
    }

    /**
     * Créer un nouveau produit
     */
    async createProduct(productData: Omit<AgriculturalProduct, 'id' | 'created_at' | 'updated_at'>): Promise<AgriculturalProduct> {
        // Calculer le pourcentage de réduction si promotion activée
        if (productData.is_promotion_enabled && productData.promo_price && productData.regular_price) {
            productData.discount_percentage = Math.round(
                ((productData.regular_price - productData.promo_price) / productData.regular_price) * 100
            );
        }

        const { data, error } = await this.supabase
            .from('agricultural_products')
            .insert([productData])
            .select()
            .single();

        if (error) {
            console.error('Erreur création produit:', error);
            throw error;
        }

        return data;
    }

    /**
     * Récupérer tous les produits
     */
    async getProducts(filters?: {
        status?: string;
        category?: string;
        userId?: string;
    }): Promise<AgriculturalProduct[]> {
        let query = this.supabase
            .from('agricultural_products')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.category) {
            query = query.eq('category', filters.category);
        }

        if (filters?.userId) {
            query = query.eq('assigned_user_id', filters.userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erreur récupération produits:', error);
            throw error;
        }

        return data || [];
    }

    /**
     * Récupérer un produit par ID
     */
    async getProductById(id: string): Promise<AgriculturalProduct> {
        const { data, error } = await this.supabase
            .from('agricultural_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erreur récupération produit:', error);
            throw error;
        }

        return data;
    }

    /**
     * Mettre à jour un produit
     */
    async updateProduct(id: string, updates: Partial<AgriculturalProduct>): Promise<AgriculturalProduct> {
        // Recalculer le pourcentage de réduction si nécessaire
        if (updates.is_promotion_enabled && updates.promo_price && updates.regular_price) {
            updates.discount_percentage = Math.round(
                ((updates.regular_price - updates.promo_price) / updates.regular_price) * 100
            );
        }

        const { data, error } = await this.supabase
            .from('agricultural_products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Erreur mise à jour produit:', error);
            throw error;
        }

        return data;
    }

    /**
     * Supprimer un produit
     */
    async deleteProduct(id: string): Promise<void> {
        // Récupérer le produit pour supprimer les images
        const product = await this.getProductById(id);

        // Supprimer les images Cloudflare
        if (product.main_image?.cloudflareId) {
            await this.cloudflareService.deleteImage(product.main_image.cloudflareId);
        }

        if (product.variant_images) {
            for (const image of product.variant_images) {
                if (image.cloudflareId) {
                    await this.cloudflareService.deleteImage(image.cloudflareId);
                }
            }
        }

        // Supprimer le produit
        const { error } = await this.supabase
            .from('agricultural_products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Erreur suppression produit:', error);
            throw error;
        }
    }

    /**
     * Upload et attacher une image principale
     */
    async uploadMainImage(productId: string, file: File, description?: string): Promise<AgriculturalProduct> {
        try {
            // Upload vers Cloudflare
            const cloudflareResponse = await this.cloudflareService.uploadImage(file);

            // Créer l'objet image
            const mainImage: ProductImage = {
                cloudflareId: cloudflareResponse.result.id,
                url: this.cloudflareService.getImageUrl(cloudflareResponse.result.id),
                name: file.name,
                size: file.size,
                uploaded_at: new Date().toISOString(),
                description: description,
                variant: 'main'
            };

            // Mettre à jour le produit
            return await this.updateProduct(productId, { main_image: mainImage });
        } catch (error) {
            console.error('Erreur upload image principale:', error);
            throw error;
        }
    }

    /**
     * Upload et attacher des images variantes
     */
    async uploadVariantImages(productId: string, files: File[]): Promise<AgriculturalProduct> {
        try {
            const product = await this.getProductById(productId);
            const currentVariants = product.variant_images || [];

            const uploadPromises = files.map(file =>
                this.cloudflareService.uploadImage(file)
            );

            const responses = await Promise.all(uploadPromises);

            const newVariantImages: ProductImage[] = responses.map((response, index) => ({
                cloudflareId: response.result.id,
                url: this.cloudflareService.getImageUrl(response.result.id),
                name: files[index].name,
                size: files[index].size,
                uploaded_at: new Date().toISOString(),
                description: '',
                variant: 'variant'
            }));

            const allVariantImages = [...currentVariants, ...newVariantImages];

            return await this.updateProduct(productId, { variant_images: allVariantImages });
        } catch (error) {
            console.error('Erreur upload images variantes:', error);
            throw error;
        }
    }

    /**
     * Supprimer une image variante
     */
    async deleteVariantImage(productId: string, imageIndex: number): Promise<AgriculturalProduct> {
        const product = await this.getProductById(productId);

        if (!product.variant_images || product.variant_images.length <= imageIndex) {
            throw new Error('Image variante non trouvée');
        }

        const imageToDelete = product.variant_images[imageIndex];

        // Supprimer de Cloudflare
        if (imageToDelete.cloudflareId) {
            await this.cloudflareService.deleteImage(imageToDelete.cloudflareId);
        }

        // Supprimer du tableau
        const updatedVariants = product.variant_images.filter((_, index) => index !== imageIndex);

        return await this.updateProduct(productId, { variant_images: updatedVariants });
    }
}