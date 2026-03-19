import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginUsuario = { username: '', password: '' };
  errorMessage = '';
  mostrarPassword = false;
  recordarme = false;
  mostrarModalRecuperacion = false;
  recuperacionEmail = '';

  constructor(private authService: AuthService, private router: Router, private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.recordarme = localStorage.getItem('remember_me') === 'true';
    if (this.authService.hasToken()) {
      this.dirigirUsuarioSegunRol();
    }
  }

  onLogin(): void {
    if (!this.loginUsuario.username || !this.loginUsuario.password) {
      this.errorMessage = 'Por favor, completa todos los campos';
      return;
    }

    this.errorMessage = ''; // Limpiar errores previos

    this.authService.login(this.loginUsuario, this.recordarme).subscribe({
      next: (res) => {
        console.log('✅ Login exitoso:', res);
        console.log('🔍 Token guardado:', this.authService.getToken());
        console.log('🔍 Username guardado:', this.authService.getUsername());
        console.log('🔍 Authorities guardadas:', this.authService.getAuthorities());
        console.log('🔍 isAdmin():', this.authService.isAdmin());
        console.log('🔍 isCocinero():', this.authService.isCocinero());
        console.log('🔍 isMesero():', this.authService.isMesero());
        // Pequeño timeout para asegurar que el AuthService guardó los datos antes de navegar
        setTimeout(() => this.dirigirUsuarioSegunRol(), 100);
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        if (err.status === 401) {
          this.errorMessage = 'Usuario o contraseña incorrectos';
        } else {
          this.errorMessage = 'Error conectando al servidor';
        }
      }
    });
  }

  private dirigirUsuarioSegunRol(): void {
    console.log('🔍 Verificando roles para redirección...');
    console.log('🔍 isAdmin():', this.authService.isAdmin());
    console.log('🔍 isAdminOrCocina():', this.authService.isAdminOrCocina());
    console.log('🔍 isCocinero():', this.authService.isCocinero());
    console.log('🔍 isMesero():', this.authService.isMesero());
    console.log('🔍 getAuthorities():', this.authService.getAuthorities());
    
    // Redirigir según el rol específico
    if (this.authService.isAdmin()) {
      console.log('➡️ Navegando a Admin/Usuarios (Admin)');
      this.router.navigate(['/admin/usuarios']);
    } else if (this.authService.isCocinero()) {
      console.log('➡️ Navegando a Cocina (Cocinero)');
      this.router.navigate(['/cocina']);
    } else {
      console.log('➡️ Navegando a Mesas (Mesero)');
      this.router.navigate(['/mesas']);
    }
  }

  togglePassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // Lógica del Modal
  mostrarRecuperacion(): void {
    this.mostrarModalRecuperacion = true;
    this.errorMessage = '';
  }

  cerrarModalRecuperacion(): void {
    this.mostrarModalRecuperacion = false;
    this.recuperacionEmail = '';
  }

  enviarRecuperacion(): void {
    if (!this.recuperacionEmail?.trim()) {
      this.notificationService.showError('Error', 'Ingresa un correo o teléfono');
      return;
    }
    
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log('Token generado:', token);
    
    // Token generado silenciosamente sin notificación visible
    
    // Generar URL correcta con ambos parámetros en queryParams
    this.router.navigate(['/recuperar-contrasena'], { 
      queryParams: { 
        email: this.recuperacionEmail,
        token: token
      }
    });
  }
}