import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';

// Importar NgForm para formularios
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgIf, NgFor, NgClass],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {
  usuarios: any[] = [];
  nuevoUsuario = {
    username: '',
    password: '',
    nombreCompleto: '',
    email: '',
    telefono: '',
    rol: 'MESERO'
  };
  mostrarFormulario = false;
  editandoUsuario: any = null;
  contrasenaActual: string = ''; // Para mostrar la contraseña actual al editar
  mostrarPassword: boolean = false; // Para mostrar/ocultar contraseña

  constructor(
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuarioService.listarUsuarios().subscribe({
      next: (res) => {
        console.log('📋 Usuarios recibidos del backend:', res);
        this.usuarios = res;
      },
      error: (err) => console.error('Error cargando usuarios', err)
    });
  }

  registrarUsuario(): void {
    if (!this.nuevoUsuario.username || !this.nuevoUsuario.password || !this.nuevoUsuario.nombreCompleto || !this.nuevoUsuario.email) {
      this.notificationService.showError('Error de Validación', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Validar que la contraseña tenga al menos 6 caracteres
    if (this.nuevoUsuario.password.length < 6) {
      this.notificationService.showError('Contraseña Inválida', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Crear usuario para el bypass de login
    const userForAuth = this.authService.createUserForRole(
      this.nuevoUsuario.username,
      this.nuevoUsuario.email,
      this.nuevoUsuario.password,
      this.nuevoUsuario.rol,
      this.nuevoUsuario.nombreCompleto || 'Usuario',
      this.nuevoUsuario.telefono || '000 000 000'
    );

    // Guardar en localStorage para login posterior
    this.authService.saveCreatedUser(userForAuth);

    this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
      next: () => {
        this.notificationService.showSuccess('Usuario Registrado', 'Usuario registrado con éxito');
        this.nuevoUsuario = { username: '', password: '', nombreCompleto: '', email: '', telefono: '', rol: 'MESERO' };
        this.mostrarFormulario = false;
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error detallado:', err);
        const msg = err.error?.message || err.error || 'Mensaje no disponible';
        this.notificationService.showError(`Error ${err.status}`, `Error al registrar: ${msg}`);
      }
    });
  }

  editarUsuario(usuario: any): void {
    this.editandoUsuario = { ...usuario };
    this.nuevoUsuario = { 
      ...usuario,
      password: '' // Dejar contraseña vacía para que se ingrese nueva si se desea
    };
    this.contrasenaActual = '••••••••'; // Mostrar placeholder de contraseña actual
    this.mostrarFormulario = true;
  }

  actualizarUsuario(): void {
    if (!this.editandoUsuario) return;

    // Si no se ingresa nueva contraseña, mantener la actual
    if (!this.nuevoUsuario.password || this.nuevoUsuario.password.trim() === '') {
      // Crear copia sin contraseña para mantener la actual
      const datosActualizar = {
        nombreCompleto: this.nuevoUsuario.nombreCompleto,
        username: this.nuevoUsuario.username,
        rol: this.nuevoUsuario.rol
      };
      
      this.usuarioService.actualizarUsuario(this.editandoUsuario.id, datosActualizar).subscribe({
        next: () => {
          this.notificationService.showSuccess('Usuario Actualizado', 'Usuario actualizado con éxito');
          this.cancelarEdicion();
          this.cargarUsuarios(); // Refrescar lista
        },
        error: (err: any) => {
          console.error('Error actualizando:', err);
          this.notificationService.showError('Error', 'No se pudo actualizar el usuario');
        }
      });
    } else {
      // Validar que la nueva contraseña tenga al menos 6 caracteres
      if (this.nuevoUsuario.password.length < 6) {
        this.notificationService.showError('Contraseña Inválida', 'La contraseña debe tener al menos 6 caracteres');
        return;
      }
      
      // Enviar con nueva contraseña
      this.usuarioService.actualizarUsuario(this.editandoUsuario.id, this.nuevoUsuario).subscribe({
        next: () => {
          // Actualizar también en localStorage para que el login funcione
          const createdUsersJson = localStorage.getItem('created_users');
          const createdUsers = createdUsersJson ? JSON.parse(createdUsersJson) : [];
          const userIndex = createdUsers.findIndex((u: any) => u.username === this.nuevoUsuario.username);
          
          if (userIndex !== -1) {
            // Actualizar contraseña y otros datos en localStorage
            createdUsers[userIndex] = {
              ...createdUsers[userIndex],
              username: this.nuevoUsuario.username,
              password: this.nuevoUsuario.password,
              email: this.nuevoUsuario.email,
              nombreCompleto: this.nuevoUsuario.nombreCompleto,
              rol: this.nuevoUsuario.rol
            };
            
            // Guardar en localStorage
            localStorage.setItem('created_users', JSON.stringify(createdUsers));
            console.log('💾 Usuario actualizado en localStorage:', createdUsers[userIndex]);
          }
          
          this.notificationService.showSuccess('Usuario Actualizado', 'Usuario actualizado con éxito');
          this.cancelarEdicion();
          this.cargarUsuarios(); // Refrescar lista
        },
        error: (err: any) => {
          console.error('Error actualizando:', err);
          this.notificationService.showError('Error', 'No se pudo actualizar el usuario');
        }
      });
    }
  }

  eliminarUsuario(id: number, nombre: string): void {
    const nombreMostrar = nombre || 'este usuario';
    console.log('🗑️ Intentando eliminar usuario:', { id, nombreMostrar });
    
    this.confirmService.confirm({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a "${nombreMostrar}"?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.usuarioService.eliminarUsuario(id).subscribe({
          next: (response) => {
            console.log('Respuesta del backend:', response);
            this.notificationService.showSuccess('Usuario Eliminado', 'Usuario eliminado con éxito');
            this.cargarUsuarios(); // Refrescar lista inmediatamente
          },
          error: (err: any) => {
            console.error('Error eliminando:', err);
            
            // Si el status es 200 pero hay error, puede ser problema de procesamiento
            if (err.status === 200 && err.error) {
              // El backend devolvió 200 pero con contenido que Angular interpreta como error
              console.log('El backend devolvió 200 pero con contenido:', err.error);
              this.notificationService.showSuccess('Usuario Eliminado', 'Usuario eliminado con éxito');
              this.cargarUsuarios();
              return;
            }
            
            const errorMsg = err.error?.message || err.error || 'Error desconocido';
            
            // Si el error es porque no se puede eliminar (ej: usuario en uso)
            if (err.status === 400 || err.status === 409) {
              this.notificationService.showError('Error', `No se puede eliminar el usuario: ${errorMsg}`);
            } else if (err.status === 200) {
              // Caso especial: status 200 pero Angular lo trata como error
              this.notificationService.showSuccess('Usuario Eliminado', 'Usuario eliminado con éxito');
              this.cargarUsuarios();
            } else {
              this.notificationService.showError(`Error ${err.status}`, `Error: ${errorMsg}`);
            }
          }
        });
      }
    });
  }

  cancelarEdicion(): void {
    this.editandoUsuario = null;
    this.contrasenaActual = '';
    this.mostrarPassword = false;
    this.nuevoUsuario = { username: '', password: '', nombreCompleto: '', email: '', telefono: '', rol: 'MESERO' };
    this.mostrarFormulario = false;
  }

  // Método para limpiar completamente el formulario
  limpiarFormulario(): void {
    this.editandoUsuario = null;
    this.contrasenaActual = '';
    this.mostrarPassword = false;
    this.nuevoUsuario = { username: '', password: '', nombreCompleto: '', email: '', telefono: '', rol: 'MESERO' };
    this.mostrarFormulario = true;
  }
}
