import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    // Permitir acceso a login y recuperación de contraseña sin token
    const currentUrl = this.router.url;
    if (currentUrl.includes('/login') || currentUrl.includes('/recuperar-contrasena')) {
      return true;
    }

    if (!this.authService.hasToken()) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
