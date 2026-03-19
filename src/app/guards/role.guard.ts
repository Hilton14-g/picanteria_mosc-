import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['expectedRoles'] as string[];
    const userRoles = this.authService.getAuthorities();

    if (!this.authService.hasToken()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Extraer los authority strings de los objetos
    const userAuthorityStrings = userRoles.map((auth: any) => auth.authority);
    
    const hasRole = expectedRoles.some(role => userAuthorityStrings.includes(role));

    if (!hasRole) {
      if(userAuthorityStrings.includes('ROLE_ADMIN')) return true; // Admins always have access
      this.router.navigate(['/']); // Or forbidden page
      return false;
    }
    return true;
  }
}
