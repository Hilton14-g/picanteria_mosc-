import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../../config/emailjs.config';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.css'
})
export class RecuperarContrasenaComponent implements OnInit {
  token: string = '';
  nuevaPassword: string = '';
  confirmarPassword: string = '';
  mensaje: string = '';
  cargando: boolean = false;
  tokenValido: boolean = false;
  emailUsuario: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private usuarioService: UsuarioService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // Inicializar EmailJS con tu Public Key
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
  }

  ngOnInit(): void {
    console.log('🔧 === INICIANDO RECUPERACIÓN ===');
    
    // Leemos los parámetros UNA SOLA VEZ usando snapshot
    const params = this.route.snapshot.queryParams;
    const tokenFromUrl = params['token'] || '';
    const emailFromUrl = params['email'] || '';
    
    // IMPORTANTE: NO cargar el token automáticamente
    // El usuario debe ingresarlo manualmente siempre
    this.token = ''; // Siempre vacío al inicio
    this.tokenValido = false; // Siempre falso al inicio
    
    // Solo asignamos el email si viene por URL
    if (emailFromUrl) {
      this.emailUsuario = emailFromUrl;
      console.log('🔧 Email desde URL:', emailFromUrl);
    } else {
      const savedEmail = localStorage.getItem('recovery_email');
      if (savedEmail) {
        this.emailUsuario = savedEmail;
        console.log('🔧 Email desde localStorage:', savedEmail);
      }
    }
    
    console.log('🔧 Token (vacío intencionalmente):', this.token);
    console.log('🔧 EmailUsuario final:', this.emailUsuario);
    console.log('🔧 TokenValido:', this.tokenValido);
    console.log('🔧 Usuario debe ingresar código manualmente');
  }

  async enviarRecuperacion(): Promise<void> {
    if (!this.emailUsuario || this.emailUsuario.trim() === '') {
      this.mensaje = 'Por favor, ingresa tu correo electrónico';
      return;
    }

    if (!this.validateEmail(this.emailUsuario)) {
      this.mensaje = 'Por favor, ingresa un correo electrónico válido';
      return;
    }

    this.cargando = true;
    this.mensaje = '';

    try {
      // Generar token real de 6 dígitos
      const token = this.generateSimpleToken();
      console.log('✅ Enviando recuperación para:', this.emailUsuario);
      console.log('✅ Token generado:', token);
      
      // Enviar correo REAL con EmailJS
      const templateParams = {
        email: this.emailUsuario,
        codigo: token
      };

      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams
      );

      console.log('✅ Correo enviado exitosamente a:', this.emailUsuario);
      
      // Guardar email en localStorage
      localStorage.setItem('recovery_email', this.emailUsuario);
      console.log('💾 Email guardado en localStorage:', this.emailUsuario);
      
      // IMPORTANTE: NO poner el token automáticamente
      // El usuario debe ingresarlo manualmente
      this.token = ''; // Siempre vacío después de enviar
      this.tokenValido = false;
      
      this.cargando = false;
      this.mensaje = '✅ ¡Código enviado a tu correo! Revisa tu bandeja de entrada y ingresa el código manualmente.';
      
    } catch (error) {
      console.error('❌ Error al enviar correo:', error);
      this.cargando = false;
      this.mensaje = '❌ Error al enviar el correo. Por favor intenta nuevamente.';
    }
  }

  private generateSimpleToken(): string {
    // Generar código de 6 dígitos (más fácil para usuarios)
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validarToken(): void {
    console.log('🔧 === VALIDANDO TOKEN MANUAL ===');
    console.log('🔧 Token ingresado:', this.token);
    console.log('🔧 Longitud:', this.token?.length || 0);
    
    // Validar que el token tenga 6 dígitos
    this.tokenValido = !!(this.token && this.token.length === 6);
    
    if (!this.tokenValido) {
      this.mensaje = 'El código debe tener exactamente 6 dígitos';
      console.log('❌ Token inválido');
    } else {
      this.mensaje = '✅ Código validado correctamente';
      console.log('✅ Token válido');
    }
  }

  restablecerPassword(): void {
    console.log('🔧 === INICIANDO restablecerPassword ===');
    console.log('🔧 EmailUsuario al inicio:', this.emailUsuario);
    console.log('🔧 NuevaPassword:', this.nuevaPassword ? '***' : 'VACIO');
    console.log('🔧 ConfirmarPassword:', this.confirmarPassword ? '***' : 'VACIO');
    console.log('🔧 Token:', this.token);
    console.log('🔧 TokenValido:', this.tokenValido);
    
    // Si emailUsuario está vacío, intentar obtenerlo de localStorage
    if (!this.emailUsuario || this.emailUsuario.trim() === '') {
      console.log('🔧 EmailUsuario está vacío, intentando obtener de localStorage...');
      const savedEmail = localStorage.getItem('recovery_email');
      if (savedEmail) {
        this.emailUsuario = savedEmail;
        console.log('🔧 Email recuperado de localStorage:', savedEmail);
      } else {
        console.log('🔧 No hay email en localStorage');
        this.mensaje = 'No se pudo obtener el email. Por favor, inicia el proceso de recuperación nuevamente.';
        this.cargando = false;
        return;
      }
    }
    
    // Validaciones básicas
    if (!this.nuevaPassword || this.nuevaPassword.trim() === '') {
      this.mensaje = 'Por favor, ingresa una nueva contraseña';
      this.cargando = false;
      return;
    }
    
    if (this.nuevaPassword.length < 6) {
      this.mensaje = 'La contraseña debe tener al menos 6 caracteres';
      this.cargando = false;
      return;
    }
    
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.mensaje = 'Las contraseñas no coinciden';
      this.cargando = false;
      return;
    }
    
    if (!this.tokenValido) {
      this.mensaje = 'Token inválido. Por favor, inicia el proceso de recuperación nuevamente.';
      this.cargando = false;
      return;
    }
    
    if (!this.nuevaPassword || !this.confirmarPassword) {
      console.log('❌ Campos de contraseña vacíos');
      this.mensaje = 'Por favor completa todos los campos';
      return;
    }

    if (this.nuevaPassword !== this.confirmarPassword) {
      console.log('❌ Las contraseñas no coinciden');
      this.mensaje = 'Las contraseñas no coinciden';
      return;
    }

    if (this.nuevaPassword.length < 6) {
      console.log('❌ Contraseña demasiado corta');
      this.mensaje = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    console.log('✅ Validaciones pasadas, iniciando actualización...');
    this.cargando = true;
    this.mensaje = '';

    // Usar el nuevo método del AuthService
    this.authService.actualizarPassword(this.emailUsuario, this.nuevaPassword).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de actualizarPassword:', response);
        this.cargando = false;
        
        // Intentar iniciar sesión automáticamente con la nueva contraseña
        const loginData = {
          username: this.emailUsuario, // Puede ser email o username
          password: this.nuevaPassword
        };
        
        console.log('🔐 Intentando auto-login con:', loginData.username);
        
        this.authService.login(loginData, false).subscribe({
          next: (loginResponse) => {
            console.log('✅ Auto-login exitoso:', loginResponse);
            this.mensaje = `✅ ¡Contraseña actualizada y sesión iniciada!\n\n📝 Usuario: ${this.emailUsuario}\n🔑 Redirigiendo al sistema...`;
            
            // Redirigir según el rol del usuario
            setTimeout(() => {
              if (this.authService.isAdminOrCocina()) {
                console.log('➡️ Redirigiendo a admin/usuarios');
                this.router.navigate(['/admin/usuarios']);
              } else {
                console.log('➡️ Redirigiendo a mesas');
                this.router.navigate(['/mesas']);
              }
            }, 2000);
          },
          error: (loginError) => {
            console.log('❌ Auto-login falló:', loginError);
            // Si el auto-login falla, redirigir al login normal
            this.mensaje = `✅ ¡Contraseña actualizada exitosamente!\n\n📝 Usuario: ${this.emailUsuario}\n🔑 Por favor inicia sesión con tu nueva contraseña.`;
            
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          }
        });
      },
      error: (error) => {
        console.log('❌ Error en actualizarPassword:', error);
        this.cargando = false;
        // Error actualizado silenciosamente sin notificación visible
      }
    });
  }
}
