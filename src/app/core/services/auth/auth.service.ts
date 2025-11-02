import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, AuthError, Session } from '@supabase/supabase-js';
import { PostgrestError } from '@supabase/supabase-js';
import { environment } from "../../../../environments/environment.development";
import {CryptoService} from "../../security/crypto.service";

export interface SignUpData {
    first_name: string;
    last_name: string;
    shop_name: string;
    profile: {
        personal: string;
        cooperative: string;
    };
    email: string;
    password: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export type AuthServiceError = AuthError | PostgrestError | Error;

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private supabase: SupabaseClient;
    private cryptoService = inject(CryptoService);

    constructor() {
        this.supabase = createClient(environment.supabase.url, environment.supabase.key, {
            auth: {
                autoRefreshToken: true, // Active le refresh automatique
                persistSession: true,
                detectSessionInUrl: true
            }
        });

        // Écouter les changements d'état d'authentification
        this.setupAuthStateListener();
    }

    /** Écouter les changements d'authentification */
    private setupAuthStateListener() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session);

            if (event === 'SIGNED_IN' && session) {
                // Sauvegarder les données utilisateur cryptées
                await this.saveUserDataToStorage(session.user);
            } else if (event === 'SIGNED_OUT') {
                // Nettoyer le stockage
                this.cryptoService.clearEncryptedData();
            } else if (event === 'TOKEN_REFRESHED') {
                // Mettre à jour les données stockées
                if (session?.user) {
                    await this.saveUserDataToStorage(session.user);
                }
            }
        });
    }

    /** Sauvegarder les données utilisateur cryptées */
    private async saveUserDataToStorage(user: User) {
        const userData = {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
            last_updated: new Date().toISOString()
        };
        await this.cryptoService.saveEncryptedData(userData);
    }

    /** Récupérer les données utilisateur depuis le stockage crypté */
    async getCachedUser(): Promise<User | null> {
        const cachedData = await this.cryptoService.getEncryptedData();
        if (!cachedData) return null;

        // Vérifier si les données ne sont pas trop vieilles (optionnel)
        const lastUpdated = new Date(cachedData.last_updated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 24) { // 24 heures max
            this.cryptoService.clearEncryptedData();
            return null;
        }

        return cachedData as User;
    }

    /** SIGN UP / INSCRIPTION */
    async signUp(signUpData: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
        const { data: authData, error: authError } = await this.supabase.auth.signUp({
            email: signUpData.email,
            password: signUpData.password,
            options: {
                data: {
                    first_name: signUpData.first_name,
                    last_name: signUpData.last_name,
                    shop_name: signUpData.shop_name,
                    profile: signUpData.profile
                }
            }
        });

        if (authError) {
            return { user: null, error: authError };
        }

        if (authData.user) {
            const { error: dbError } = await this.supabase
                .from('users')
                .insert({
                    id: authData.user.id,
                    first_name: signUpData.first_name,
                    last_name: signUpData.last_name,
                    shop_name: signUpData.shop_name,
                    profile: signUpData.profile,
                    email: signUpData.email,
                    created_at: new Date().toISOString()
                });

            if (dbError) {
                console.error('Erreur création user en base:', dbError);
            } else if (authData.user) {
                await this.saveUserDataToStorage(authData.user);
            }
        }

        return { user: authData.user, error: null };
    }

    /** SIGN IN / CONNEXION avec gestion du token */
    async signIn(loginData: LoginData): Promise<{ session: Session | null; error: AuthError | null }> {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: loginData.email,
                password: loginData.password
            });

            if (data?.session && data.user) {
                await this.saveUserDataToStorage(data.user);
            }

            return { session: data?.session || null, error };
        } catch (error) {
            return { session: null, error: error as AuthError };
        }
    }

    /** GET CURRENT USER avec fallback sur cache */
    async getCurrentUser(): Promise<{ user: User | null; error: AuthError | null }> {
        try {
            // D'abord essayer de récupérer depuis Supabase (vérifie le token)
            const { data, error } = await this.supabase.auth.getUser();

            if (error) {
                console.log('Erreur getUser, utilisation du cache:', error.message);
                // Si erreur (token expiré), utiliser le cache
                const cachedUser = await this.getCachedUser();
                return { user: cachedUser, error: null };
            }

            if (data.user) {
                // Mettre à jour le cache
                await this.saveUserDataToStorage(data.user);
                return { user: data.user, error: null };
            }

            return { user: null, error: null };
        } catch (error) {
            console.error('Erreur getCurrentUser:', error);
            const cachedUser = await this.getCachedUser();
            return { user: cachedUser, error: null };
        }
    }

    /** FORCER LE REFRESH DU TOKEN */
    async refreshSession(): Promise<{ session: Session | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.refreshSession();

        if (data.session && data.user) {
            await this.saveUserDataToStorage(data.user);
        }

        return { session: data.session, error };
    }

    /** VÉRIFIER SI LE TOKEN EST EXPIRÉ */
    async isTokenExpired(): Promise<boolean> {
        const { data } = await this.supabase.auth.getSession();
        if (!data.session) return true;

        const expiresAt = data.session.expires_at;
        if (!expiresAt) return true;

        const now = Math.floor(Date.now() / 1000);
        return now >= expiresAt;
    }

    /** GET USER PROFILE FROM DATABASE */
    async getUserProfile(userId: string): Promise<{ profile: any | null; error: PostgrestError | null }> {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        return { profile: data, error };
    }

    /** UPDATE USER PROFILE */
    async updateUserProfile(userId: string, profileData: Partial<SignUpData>): Promise<{ success: boolean; error: PostgrestError | null }> {
        const { error } = await this.supabase
            .from('users')
            .update(profileData)
            .eq('id', userId);

        if (error) {
            return { success: false, error };
        }

        await this.supabase.auth.updateUser({
            data: {
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                shop_name: profileData.shop_name,
                profile: profileData.profile
            }
        });

        return { success: true, error: null };
    }

    /** SIGN OUT / DÉCONNEXION */
    async signOut(): Promise<{ error: AuthError | null }> {
        this.cryptoService.clearEncryptedData();
        const { error } = await this.supabase.auth.signOut();
        return { error };
    }

    /** GET USER METADATA */
    async getUserMetadata(): Promise<any> {
        const { user } = await this.getCurrentUser();
        return user?.user_metadata || null;
    }

    /** UPDATE USER METADATA */
    async updateUserMetadata(metadata: any): Promise<{ user: User | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.updateUser({
            data: metadata
        });

        if (data.user) {
            await this.saveUserDataToStorage(data.user);
        }

        return { user: data.user, error };
    }

    /** CHECK AUTH STATE */
    getAuthState() {
        return this.supabase.auth.onAuthStateChange;
    }

    /** GET SESSION */
    async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
        const { data, error } = await this.supabase.auth.getSession();
        return { session: data.session, error };
    }

    /** IS AUTHENTICATED */
    async isAuthenticated(): Promise<boolean> {
        const { user } = await this.getCurrentUser();
        return !!user;
    }
}