import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from "../services/auth/auth.service";
import {AuthManagementService} from "../services/auth/auth-managment.service";

export const AuthGuard: CanActivateFn = async (route) => {
    const authService = inject(AuthService);
    const authManagement = inject(AuthManagementService);
    const router = inject(Router);

    try {
        // Vérifier et refresh le token si nécessaire
        const tokenValid = await authManagement.checkAndRefreshToken();
        if (!tokenValid) {
            router.navigate(['/login']);
            return false;
        }

        const { user, error } = await authService.getCurrentUser();

        if (error || !user) {
            router.navigate(['/login']);
            return false;
        }

        return true;
    } catch (error) {
        router.navigate(['/login']);
        return false;
    }
};