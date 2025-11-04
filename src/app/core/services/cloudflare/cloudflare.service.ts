// services/cloudflare.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {environment} from "../../../../environments/environment.development";

export interface CloudflareImageResponse {
    success: boolean;
    result: {
        id: string;
        filename: string;
        uploaded: string;
        requireSignedURLs: boolean;
        variants: string[];
    };
    errors: any[];
    messages: any[];
}

export interface CloudflareImageUploadResult {
    success: boolean;
    imageId: string;
    url: string;
    filename: string;
}

@Injectable({
    providedIn: 'root'
})
export class CloudflareService {
    private readonly apiUrl = `https://api.cloudflare.com/client/v4/accounts/${environment.cloudflare.accountId}/images/v1`;
    private readonly deliveryUrl = `https://imagedelivery.net/${environment.cloudflare.hash}`;

    constructor(private http: HttpClient) {}

    /**
     * Upload une image vers Cloudflare Images
     */
    async uploadImage(file: File, metadata?: any): Promise<CloudflareImageUploadResult> {
        const formData = new FormData();
        formData.append('file', file);

        // Ajouter des métadonnées optionnelles
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        try {
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${environment.cloudflare.apiToken}`
            });

            const response = await this.http.post<CloudflareImageResponse>(
                this.apiUrl,
                formData,
                { headers }
            ).toPromise();

            if (!response?.success) {
                throw new Error('Erreur lors de l\'upload Cloudflare: ' + (response?.errors?.[0]?.message || 'Unknown error'));
            }

            // Générer l'URL de l'image
            const imageUrl = this.getImageUrl(response.result.id);

            return {
                success: true,
                imageId: response.result.id,
                url: imageUrl,
                filename: file.name
            };

        } catch (error: unknown) {
            console.error('Erreur Cloudflare upload:', error);

            if (error instanceof Error) {
                throw new Error(`Échec de l'upload: ${error.message}`);
            } else if (typeof error === 'string') {
                throw new Error(`Échec de l'upload: ${error}`);
            } else {
                throw new Error('Échec de l\'upload: Erreur inconnue');
            }
        }
    }

    /**
     * Upload multiple d'images
     */
    async uploadMultipleImages(files: File[]): Promise<CloudflareImageUploadResult[]> {
        const uploadPromises = files.map(file => this.uploadImage(file));
        return Promise.all(uploadPromises);
    }

    /**
     * Supprime une image de Cloudflare
     */
    async deleteImage(imageId: string): Promise<boolean> {
        try {
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${environment.cloudflare.apiToken}`
            });

            const response = await this.http.delete<CloudflareImageResponse>(
                `${this.apiUrl}/${imageId}`,
                { headers }
            ).toPromise();

            return response?.success || false;

        } catch (error) {
            console.error('Erreur suppression Cloudflare:', error);
            throw error;
        }
    }

    /**
     * Génère l'URL d'affichage de l'image avec variant
     */
    getImageUrl(imageId: string, variant: string = 'public'): string {
        return `${this.deliveryUrl}/${imageId}/${variant}`;
    }

    /**
     * Récupère les informations d'une image
     */
    async getImageInfo(imageId: string): Promise<any> {
        try {
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${environment.cloudflare.apiToken}`
            });

            const response = await this.http.get(
                `${this.apiUrl}/${imageId}`,
                { headers }
            ).toPromise();

            return response;
        } catch (error) {
            console.error('Erreur récupération info image:', error);
            throw error;
        }
    }

    /**
     * Liste toutes les images (avec pagination)
     */
    async listImages(page: number = 1, perPage: number = 50): Promise<any> {
        try {
            const headers = new HttpHeaders({
                'Authorization': `Bearer ${environment.cloudflare.apiToken}`
            });

            const params = {
                page: page.toString(),
                per_page: perPage.toString()
            };

            const response = await this.http.get(
                this.apiUrl,
                { headers, params }
            ).toPromise();

            return response;
        } catch (error) {
            console.error('Erreur liste images:', error);
            throw error;
        }
    }
}