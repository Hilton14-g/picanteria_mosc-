import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerData = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    rol: 'MESERO'
  };
  
  errorMessage = '';
  successMessage = '';
  loading = false;
  
  roles = [
    { value: 'MESERO', label: 'Mesero' },
    { value: 'COCINA', label: 'Cocina' },
    { value: 'ADMIN', label: 'Administrador' }
  ];

  constructor(private authService: AuthService, private router: Router) {}

  onRegister(): void {
    // Resetear mensajes
    this.errorMessage = '';
    this.successMessage = '';

    // Validaciones básicas
    if (!this.registerData.username || !this.registerData.email || !this.registerData.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.registerData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.errorMessage = 'Por favor ingresa un email válido';
      return;
    }

    this.loading = true;

    // Crear el usuario usando el método del AuthService
    try {
      const newUser = this.authService.createUserForRole(
        this.registerData.username,
        this.registerData.email,
        this.registerData.password,
        this.registerData.rol,
        'Usuario', // Default nombreCompleto
        '000 000 000' // Default telefono
      );

      // Guardar el usuario creado
      this.authService.saveCreatedUser(newUser);

      this.successMessage = `✅ Usuario ${this.registerData.username} creado exitosamente!`;
      
      // Limpiar formulario
      this.registerData = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        rol: 'MESERO'
      };

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);

    } catch (error) {
      this.errorMessage = '❌ Error al crear el usuario. Inténtalo nuevamente.';
      console.error('Error en registro:', error);
    } finally {
      this.loading = false;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
