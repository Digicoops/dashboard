import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class CryptoService {
    private readonly storageKey = 'auth_data';
    private readonly cryptoKeyHex = '3825b6408f9da1d5fe7a3bf58af1b1b86b07dfa54ddefa0516fbee5e93b0de3e'; // Clé hexadécimale

    /** Convertir une string hex en ArrayBuffer */
    private hexToArrayBuffer(hex: string): ArrayBuffer {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    }

    /** Crypter les données */
    private async encrypt(data: any): Promise<string> {
        try {
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));

            // Convertir la clé hex en ArrayBuffer
            const keyBuffer = this.hexToArrayBuffer(this.cryptoKeyHex);

            const key = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
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
        } catch (error) {
            console.error('Erreur encryption:', error);
            throw error;
        }
    }

    /** Décrypter les données */
    private async decrypt(encryptedData: string): Promise<any> {
        try {
            const encryptedArray = new Uint8Array(atob(encryptedData).split('').map(char => char.charCodeAt(0)));
            const iv = encryptedArray.slice(0, 12);
            const data = encryptedArray.slice(12);

            // Convertir la clé hex en ArrayBuffer
            const keyBuffer = this.hexToArrayBuffer(this.cryptoKeyHex);

            const key = await crypto.subtle.importKey(
                'raw',
                keyBuffer,
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
        try {
            const encrypted = await this.encrypt(data);
            sessionStorage.setItem(this.storageKey, encrypted);
        } catch (error) {
            console.error('Erreur sauvegarde cryptée:', error);
            // Fallback: sauvegarder sans cryptage
            sessionStorage.setItem(this.storageKey, JSON.stringify(data));
        }
    }

    /** Récupérer les données décryptées */
    async getEncryptedData(): Promise<any> {
        try {
            const encrypted = sessionStorage.getItem(this.storageKey);
            if (!encrypted) return null;

            // Essayer de décrypter
            const decrypted = await this.decrypt(encrypted);
            if (decrypted) return decrypted;

            // Fallback: si le décryptage échoue, essayer de parser comme JSON normal
            return JSON.parse(encrypted);
        } catch (error) {
            console.error('Erreur récupération données:', error);
            return null;
        }
    }

    /** Supprimer les données */
    clearEncryptedData(): void {
        sessionStorage.removeItem(this.storageKey);
    }
}