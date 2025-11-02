import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CryptoService {
    private readonly storageKey = 'auth_data';
    private readonly cryptoKey = 'votre-cle-secrete-32-caracteres!!'; // 32 caractères

    /** Crypter les données */
    private async encrypt(data: any): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(JSON.stringify(data));

        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(this.cryptoKey),
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedBuffer = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            dataBuffer
        );

        const encryptedArray = new Uint8Array(encryptedBuffer);
        const result = new Uint8Array(iv.length + encryptedArray.length);
        result.set(iv);
        result.set(encryptedArray, iv.length);

        return btoa(String.fromCharCode(...result));
    }

    /** Décrypter les données */
    private async decrypt(encryptedData: string): Promise<any> {
        try {
            const encryptedArray = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
            const iv = encryptedArray.slice(0, 12);
            const data = encryptedArray.slice(12);

            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
                'raw',
                encoder.encode(this.cryptoKey),
                { name: 'AES-GCM' },
                false,
                ['decrypt']
            );

            const decryptedBuffer = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                data
            );

            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decryptedBuffer));
        } catch (error) {
            console.error('Erreur décryptage:', error);
            return null;
        }
    }

    /** Sauvegarder les données cryptées */
    async saveEncryptedData(data: any): Promise<void> {
        const encrypted = await this.encrypt(data);
        sessionStorage.setItem(this.storageKey, encrypted);
    }

    /** Récupérer les données décryptées */
    async getEncryptedData(): Promise<any> {
        const encrypted = sessionStorage.getItem(this.storageKey);
        if (!encrypted) return null;
        return await this.decrypt(encrypted);
    }

    /** Supprimer les données */
    clearEncryptedData(): void {
        sessionStorage.removeItem(this.storageKey);
    }
}