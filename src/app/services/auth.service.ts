import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private host = '192.168.18.22';  // Backend IP correcta
  private authUrl = `http://${this.host}:8080/api/auth/`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USERNAME_KEY = 'username';
  private readonly AUTHORITIES_KEY = 'authorities';

  private loggedInSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkToken();
  }

  private checkToken(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (token) {
      this.loggedInSubject.next(true);
    }
  }

  public login(loginUsuario: any, recordarme: boolean = false): Observable<any> {
    console.log('🚀 Iniciando login para:', loginUsuario.username);
    console.log('🔍 Contraseña recibida:', loginUsuario.password);
    
    // Usar endpoint simple que evita AuthenticationManager
    return this.http.post(this.authUrl + 'login-simple', {
      username: loginUsuario.username,
      password: loginUsuario.password
    }).pipe(
      tap(response => {
        console.log('✅ Respuesta del backend:', response);
        
        // Guardar token y datos del usuario
        const token = (response as any).jwt;
        const username = (response as any).username;
        const authorities = (response as any).authorities;
        
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USERNAME_KEY, username);
        localStorage.setItem(this.AUTHORITIES_KEY, JSON.stringify(authorities));
        
        console.log('💾 Guardando en localStorage:');
        console.log('- Token:', token);
        console.log('- Username:', username);
        console.log('- Authorities:', JSON.stringify(authorities));
        
        this.loggedInSubject.next(true);
      }),
      catchError(error => {
        console.error('❌ Error en login al backend:', error);
        return throwError(() => error);
      })
    );
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USERNAME_KEY);
    localStorage.removeItem(this.AUTHORITIES_KEY);
    this.loggedInSubject.next(false);
    this.router.navigate(['/login']);
  }

  public isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public hasToken(): boolean {
    return !!this.getToken();
  }

  public getUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  public getAuthorities(): any[] {
    const authorities = localStorage.getItem(this.AUTHORITIES_KEY);
    return authorities ? JSON.parse(authorities) : [];
  }

  public isAdmin(): boolean {
    const authorities = this.getAuthorities();
    return authorities.some((auth: any) => auth.authority === 'ROLE_ADMIN');
  }

  public isAdminOrCocina(): boolean {
    const authorities = this.getAuthorities();
    return authorities.some((auth: any) => 
      auth.authority === 'ROLE_ADMIN' || auth.authority === 'ROLE_COCINA'
    );
  }

  public isCocinero(): boolean {
    const authorities = this.getAuthorities();
    return authorities.some((auth: any) => auth.authority === 'ROLE_COCINA');
  }

  public isMesero(): boolean {
    const authorities = this.getAuthorities();
    return authorities.some((auth: any) => auth.authority === 'ROLE_MESERO');
  }

  public getCurrentUser(): string | null {
    return this.getUsername();
  }

  public getCurrentUserObject(): any {
    const username = this.getUsername();
    const authorities = this.getAuthorities();
    
    if (username && authorities.length > 0) {
      return {
        username: username,
        authorities: authorities
      };
    }
    return null;
  }

  public recuperarPassword(email: string): Observable<any> {
    console.log('🔧 Enviando solicitud de recuperación para:', email);
    return this.http.post(this.authUrl + 'recuperar-password', { email });
  }

  public actualizarPassword(email: string, nuevaPassword: string): Observable<any> {
    console.log('🔧 Actualizando contraseña para:', email);
    return this.http.post(this.authUrl + 'actualizar-password', { email, nuevaPassword });
  }

  public createUserForRole(username: string, email: string, password: string, rol: string, nombreCompleto: string, telefono: string): any {
    return {
      username: username,
      email: email,
      password: password,
      rol: rol,
      nombre_completo: nombreCompleto,
      telefono: telefono,
      authorities: [{ authority: 'ROLE_' + rol.toUpperCase() }]
    };
  }

  public saveCreatedUser(user: any): void {
    // Este método guardaba usuarios localmente, pero ahora usamos el backend
    console.log('🔧 Usuario creado (ahora se maneja en backend):', user);
  }

  public forceRecoverAuthorities(): void {
    // Forzar la recuperación de autoridades desde el token
    const token = this.getToken();
    if (token) {
      // En una implementación real, aquí decodificarías el token JWT
      console.log('🔧 Forzando recuperación de autoridades desde token');
    }
  }

  public get loggedIn$(): Observable<boolean> {
    return this.loggedInSubject.asObservable();
  }
}
