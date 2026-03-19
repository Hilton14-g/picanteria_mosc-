import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router'; // <--- Importamos ActivatedRoute
import { MesaService } from '../../services/mesa.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mesas.component.html',
  styleUrls: ['./mesas.component.css']
})
export class MesasComponent implements OnInit {
  mesas: any[] = [];
  esAdmin: boolean = false; // Por defecto es cliente
  esMeseroOCocinero: boolean = false; // Para meseros y cocineros
  mesaAcceso: number | null = null; // Mesa específica a la que tiene acceso el cliente

  constructor(
    private mesaService: MesaService, 
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    console.log('🔍 Iniciando componente de mesas...');
    
    // 1. Capturar el mesaId de la URL de forma automática
    // Si la ruta es /mesas/3, params['mesaId'] será 3
    this.route.params.subscribe(params => {
      if (params['mesaId']) {
        // SOLO restringir si viene de un QR de cliente (no tiene sesión)
        if (!this.authService.hasToken()) {
          this.mesaAcceso = Number(params['mesaId']);
          localStorage.setItem('mesa_acceso', this.mesaAcceso.toString());
          console.log('🎯 Cliente escaneó QR, restringiendo a mesa:', this.mesaAcceso);
        } else {
          // Si tiene sesión, es un usuario normal, no restringir
          console.log('👤 Usuario con sesión activa, no restringir acceso');
          localStorage.removeItem('mesa_acceso');
        }
      } else {
        // Si no hay parámetro, verificamos si es cliente sin sesión
        if (!this.authService.hasToken()) {
          const guardada = localStorage.getItem('mesa_acceso');
          if (guardada) {
            this.mesaAcceso = Number(guardada);
            console.log('🔒 Cliente sin sesión, acceso restringido:', this.mesaAcceso);
          }
        } else {
          // Si tiene sesión, limpiar cualquier restricción anterior
          console.log('👤 Usuario con sesión activa, limpiando restricciones');
          localStorage.removeItem('mesa_acceso');
          this.mesaAcceso = null;
        }
      }
      
      // Detectar roles solo si hay sesión activa
      if (this.authService.hasToken()) {
        console.log('👤 Usuario con sesión activa, detectando roles...');
        
        // Forzar recuperación de authorities antes de verificar roles
        this.authService.forceRecoverAuthorities();
        
        // Pequeño delay para asegurar que las authorities se recuperen
        setTimeout(() => {
          // Detectar roles del usuario
          this.esAdmin = this.authService.isAdmin();
          this.esMeseroOCocinero = this.authService.isCocinero() || this.authService.isMesero();
          
          // Debug: Mostrar roles del usuario
          console.log('🔍 Roles del usuario:');
          console.log('- esAdmin:', this.esAdmin);
          console.log('- esMeseroOCocinero:', this.esMeseroOCocinero);
          console.log('- Authorities:', this.authService.getAuthorities());
          
          // Cargar las mesas
          this.obtenerMesas();
        }, 200);
      } else {
        console.log('👤 Cliente sin login - modo cliente activado');
        // Cargar las mesas sin verificar roles
        this.obtenerMesas();
      }
    });

    // Refrescar automáticamente cada 3000ms (3 segundos)
    setInterval(() => {
      this.obtenerMesas();
    }, 3000);
  }

  obtenerMesas() {
    this.mesaService.getMesas().subscribe({
      next: (data) => {
        this.mesas = data;
        console.log('📊 Mesas cargadas:', this.mesas.length);
      },
      error: (err) => console.error('Error al cargar mesas:', err)
    });
  }

  // Esta función es CLAVE para la vista (sugerencia de Gemini)
  estaBloqueadaParaCliente(mesaId: number): boolean {
    // Si es personal del restaurante, NADA está bloqueado
    if (this.esAdmin || this.esMeseroOCocinero) return false;
    
    // Si es cliente y tiene una mesa asignada, bloquea todas las DEMÁS
    if (this.mesaAcceso !== null) {
      return mesaId !== this.mesaAcceso;
    }
    
    return false;
  }

  // Filtrar mesas según el acceso del cliente
  getMesasVisibles(): any[] {
    // Si es admin, mesero o cocinero, ve todas las mesas
    if (this.esAdmin || this.esMeseroOCocinero) {
      return this.mesas;
    }
    
    // Si es cliente, siempre ve todas las mesas (para visualización)
    return this.mesas;
  }

  // Verificar si puede acceder a una mesa específica
  puedeAccederMesa(mesaId: number): boolean {
    // Si es admin, mesero o cocinero, puede acceder a cualquier mesa
    if (this.esAdmin || this.esMeseroOCocinero) {
      return true;
    }
    
    // Si es cliente con acceso restringido (viene de QR), solo puede acceder a su mesa
    if (this.mesaAcceso !== null) {
      return mesaId === this.mesaAcceso;
    }
    
    // Si es cliente sin acceso restringido (no viene de QR), puede acceder a cualquier mesa
    return true;
  }

  // Limpiar acceso restringido (cuando el cliente termina)
  limpiarAccesoRestringido(): void {
    localStorage.removeItem('mesa_acceso');
    this.mesaAcceso = null;
    console.log('🔓 Acceso restringido limpiado');
  }

  // Verificar si tiene acceso restringido
  tieneAccesoRestringido(): boolean {
    return this.mesaAcceso !== null && !this.authService.hasToken();
  }

  seleccionarMesa(mesa: any) {
    console.log('🔍 Intentando acceder a mesa:', mesa.id);
    console.log('🔍 mesaAcceso:', this.mesaAcceso);
    console.log('🔍 esAdmin:', this.esAdmin);
    console.log('🔍 esMeseroOCocinero:', this.esMeseroOCocinero);
    
    // Si es cliente con acceso restringido, solo puede hacer clic en su mesa
    if (this.mesaAcceso !== null && !this.esAdmin && !this.esMeseroOCocinero) {
      if (mesa.id !== this.mesaAcceso) {
        console.log('🚫 Cliente no puede hacer clic en mesa:', mesa.id);
        return; // No hace nada, no muestra alerta
      }
      console.log('✅ Cliente haciendo clic en su mesa:', mesa.id);
    }
    
    // Admin, mesero o cocinero: puede hacer clic en cualquier mesa
    if (this.esAdmin || this.esMeseroOCocinero) {
      console.log('👤 Personal haciendo clic en mesa:', mesa.id);
    }
    
    // Solo clientes no pueden entrar a mesas ocupadas (PERO si es SU mesa, sí puede)
    const esCliente = !this.esAdmin && !this.esMeseroOCocinero;
    
    if (mesa.estado === 'OCUPADA' && esCliente) {
      // Si es su propia mesa ocupada, ir a seguir editando su pedido
      if (this.mesaAcceso !== null && mesa.id === this.mesaAcceso) {
        console.log('✅ Cliente yendo a editar su pedido ocupado:', mesa.id);
        // Ir a seguir editando su pedido (no a mesa-cuenta)
        this.router.navigate(['/nuevo-pedido', mesa.id]);
        return;
      }
      
      this.notificationService.showWarning('Mesa Ocupada', 'Esta mesa ya está siendo atendida');
      return;
    }
    
    // Si es admin, mesero o cocinero y la mesa está ocupada, ir a gestionar cuenta
    if (mesa.estado === 'OCUPADA' && (this.esAdmin || this.esMeseroOCocinero)) {
      this.router.navigate(['/mesa-cuenta', mesa.id]);
      return;
    }
    
    // Si está libre, ir a hacer pedido
    console.log('🚀 Navegando a pedido de mesa:', mesa.id);
    this.router.navigate(['/nuevo-pedido', mesa.id]);
  }

  liberarMesa(event: Event, mesaId: number) {
    event.stopPropagation();
    
    this.confirmService.confirm({
      message: `¿Deseas liberar la Mesa ${mesaId}?`,
      confirmText: 'Liberar',
      cancelText: 'Cancelar',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.mesaService.cambiarEstado(mesaId, 'LIBRE').subscribe({
          next: () => {
            // Limpiamos el rastro del pedido en el navegador para que un nuevo cliente no lo vea
            localStorage.removeItem(`pedido_mesa_${mesaId}`);
            
            // 1. Actualizamos localmente el estado del objeto en el array
            const index = this.mesas.findIndex(m => m.id === mesaId);
            if (index !== -1) {
              this.mesas[index].estado = 'LIBRE'; 
            }
            
            // 2. Opcional: Si quieres asegurar que Angular vea el cambio, 
            // puedes hacer una copia del array (esto fuerza la detección de cambios)
            this.mesas = [...this.mesas];
            
            console.log("Mesa liberada y vista actualizada");
            this.notificationService.showSuccess('Mesa Liberada', `Mesa ${mesaId} liberada exitosamente`);
          },
          error: (err) => {
            console.error('Error al liberar:', err);
            this.notificationService.showError('Error', 'No se pudo liberar la mesa');
          }
        });
      }
    });
  }

  gestionarCuenta(event: Event, mesaId: number) {
    event.stopPropagation();
    this.router.navigate(['/mesa-cuenta', mesaId]);
  }
}