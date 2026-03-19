import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { MesaService } from '../../services/mesa.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-nuevo-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './nuevo-pedido.component.html',
  styleUrls: ['./nuevo-pedido.component.css']
})
export class NuevoPedidoComponent implements OnInit {
  mesaId: number = 0;
  productos: any[] = [];
  carrito: any[] = [];
  total: number = 0;
  categoriaSeleccionada: string = 'TODO';
  private host = '192.168.18.22'; // IP correcta para acceso desde teléfono
  mesasOcupadas: number = 0;
  tiempoEstimado: string = '';
  clienteHaPedido: boolean = false; // Nuevo: controlar si cliente ya ha pedido

  pedidoExistenteId: number | null = null;
  mensajePedido: string = '';
  detallesEnviados: any[] = [];
  isLogged: boolean = false;
  editandoEnviados: Set<number> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoService: PedidoService,
    private mesaService: MesaService, // <--- Inyectar esto
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit(): void {
    this.isLogged = this.authService.hasToken();
    this.mesaId = Number(this.route.snapshot.paramMap.get('mesaId'));
    
    // NO guardar acceso aquí - solo se guarda cuando se envía el pedido
    console.log('🎯 Cliente viendo mesa:', this.mesaId, '- sin restricción aún');
    
    this.cargarProductos(); // <-- Este ahora se encarga de verificar el estado de la mesa primero
    this.obtenerMesasOcupadas(); // <-- Obtener mesas ocupadas para cálculo de tiempo
  }

  obtenerMesasOcupadas(): void {
    this.mesaService.getMesas().subscribe({
      next: (mesas) => {
        this.mesasOcupadas = mesas.filter(m => m.estado === 'OCUPADA').length;
        console.log('🔢 Mesas ocupadas:', this.mesasOcupadas);
        this.calcularTiempoEstimado();
      },
      error: (err) => console.error('Error al obtener mesas:', err)
    });
  }

  calcularTiempoEstimado(): void {
    // Solo calcular tiempo si el cliente ya ha pedido
    if (!this.clienteHaPedido) {
      this.tiempoEstimado = '';
      return;
    }
    
    // Base: 5 minutos por pedido + 2 minutos por cada mesa ocupada adicional
    const tiempoBase = 5; // 5 minutos base por pedido
    const tiempoPorMesaOcupada = 2; // 2 minutos extras por cada mesa ocupada
    
    const tiempoTotal = tiempoBase + (this.mesasOcupadas * tiempoPorMesaOcupada);
    
    // Mínimo 10 minutos si hay mucha gente
    const tiempoMinimo = Math.max(tiempoTotal, 10);
    
    // Máximo 45 minutos si hay poca gente
    const tiempoMaximo = Math.min(tiempoMinimo, 45);
    
    this.tiempoEstimado = `${tiempoMaximo} minutos`;
    console.log('⏱️ Tiempo estimado:', this.tiempoEstimado);
    console.log('📊 Cálculo:', {
      mesasOcupadas: this.mesasOcupadas,
      tiempoBase,
      tiempoPorMesaOcupada,
      tiempoTotal,
      tiempoMinimo,
      tiempoMaximo
    });
  }

  unificarDetalles(detalles: any[]): any[] {
    const unificados = new Map();
    
    detalles.forEach(detalle => {
      const productoId = detalle.producto?.id;
      if (productoId) {
        if (unificados.has(productoId)) {
          // Si ya existe, sumar la cantidad
          const existente = unificados.get(productoId);
          existente.cantidad += detalle.cantidad;
          // Mantener el ID del detalle más antiguo para referencia
          if (!existente.idsOriginales) {
            existente.idsOriginales = [existente.id];
          }
          existente.idsOriginales.push(detalle.id);
        } else {
          // Si no existe, agregarlo
          unificados.set(productoId, {
            ...detalle,
            idsOriginales: [detalle.id] // Guardar IDs originales para referencia
          });
        }
      }
    });
    
    return Array.from(unificados.values());
  }

  cargarPedidoDeAcompanamiento() {
    // Revisar si este usuario (navegador) ya tiene un pedido activo para esta mesa
    const storageId = localStorage.getItem(`pedido_mesa_${this.mesaId}`);
    if (storageId) {
      this.pedidoExistenteId = Number(storageId);
      this.mensajePedido = `Tienes un pedido en curso (#${this.pedidoExistenteId}).`;
      
      // Cargar detalles ya enviados
      this.pedidoService.getPedidoById(this.pedidoExistenteId).subscribe({
        next: (pedido) => {
          if (pedido) {
            // Si el pedido no está PENDIENTE (ej: pagado o cancelado), lo ignoramos
            if (pedido.estado !== 'PENDIENTE') {
              this.limpiarRastroPedido();
            } else {
              // Cargar detalles y unificarlos
              const detallesOriginales = pedido.detalles || [];
              this.detallesEnviados = this.unificarDetalles(detallesOriginales).map((d: any) => ({
                ...d,
                estado: d.estado || pedido.estado
              }));
              
              // Marcar que el cliente ya ha pedido (tiene pedido existente)
              this.clienteHaPedido = true;
              this.calcularTiempoEstimado(); // Calcular tiempo para pedido existente
              
              console.log('Detalles originales:', detallesOriginales);
              console.log('Detalles unificados:', this.detallesEnviados);
            }
          }
        },
        error: (err) => {
          console.error('Error cargando detalles previos o el pedido ya no existe', err);
          this.limpiarRastroPedido();
        }
      });
    }
  }

  limpiarRastroPedido() {
    localStorage.removeItem(`pedido_mesa_${this.mesaId}`);
    this.pedidoExistenteId = null;
    this.mensajePedido = '';
    this.detallesEnviados = [];
    console.log('🧹 Rastro de pedido limpiado');
  }

  empezarPedidoNuevo() {
    this.confirmService.confirm({
      title: 'Empezar Pedido Nuevo',
      message: '¿Deseas descartar el pedido actual y empezar uno nuevo desde cero?',
      confirmText: 'Empezar Nuevo',
      cancelText: 'Cancelar',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.limpiarRastroPedido();
        this.notificationService.showInfo('Pedido Nuevo', 'Puedes empezar un nuevo pedido desde cero');
      }
    });
  }

  continuarPedidoActual() {
    // Mostrar notificación y continuar con el pedido existente
    this.notificationService.showInfo('Continuar Pedido', 'Puedes agregar más platos a tu pedido actual');
  }

  cargarProductos() {
    // 1. Verificar primero el estado de la mesa para evitar mostrar pedidos viejos
    this.mesaService.getMesas().subscribe({
      next: (mesas) => {
        const mesaActual = mesas.find(m => m.id === this.mesaId);
        if (mesaActual && mesaActual.estado === 'LIBRE') {
          console.log('Mesa libre, limpiando pedidos anteriores...');
          localStorage.removeItem(`pedido_mesa_${this.mesaId}`);
          this.pedidoExistenteId = null;
          this.mensajePedido = '';
          this.detallesEnviados = [];
        } else {
          // Si está ocupada, proceder a cargar el pedido guardado
          this.cargarPedidoDeAcompanamiento();
        }
      }
    });

    this.http.get<any[]>(`http://${this.host}:8080/api/productos`).subscribe({
      next: (res) => {
        this.productos = res.map(p => {
          let cat = p.categoria ? p.categoria.toUpperCase().trim() : '';
          if (!cat || cat === 'OTROS' || cat === 'NULL') {
            const nombre = p.nombre.toLowerCase();
            if (nombre.includes('ceviche') || nombre.includes('leche de tigre')) cat = 'CEVICHES';
            else if (nombre.includes('marisco') || nombre.includes('jalea') || nombre.includes('arroz') || nombre.includes('chicharrón') || nombre.includes('calamar')) cat = 'MARISCOS';
            else if (nombre.includes('chicha') || nombre.includes('cerveza') || nombre.includes('gaseosa') || nombre.includes('agua') || nombre.includes('limonada') || nombre.includes('kola') || nombre.includes('coca cola') || nombre.includes('inca kola')) cat = 'BEBIDAS';
            else cat = 'TODO';
          }
          const img = p.imagenUrl ? p.imagenUrl : `https://loremflickr.com/320/240/food,${p.nombre.split(' ')[0]}`;
          return { ...p, categoria: cat, imagenUrl: img };
        });
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  productosFiltrados() {
    if (this.categoriaSeleccionada === 'TODO') return this.productos;
    return this.productos.filter(p => p.categoria === this.categoriaSeleccionada);
  }

  trackByCarrito(index: number, item: any): number {
    return item.producto.id;
  }

  agregar(p: any) {
    console.log('Agregando producto:', p.nombre, 'ID:', p.id);
    console.log('Carrito antes:', this.carrito);
    
    const existe = this.carrito.find(item => item.producto.id === p.id);
    if (existe) {
      existe.cantidad++;
      console.log('Producto existente, nueva cantidad:', existe.cantidad);
    } else {
      this.carrito.push({
        producto: { id: p.id, nombre: p.nombre },
        cantidad: 1,
        precioUnitario: p.precio
      });
      console.log('Nuevo producto agregado');
    }
    
    console.log('Carrito después:', this.carrito);
    this.actualizarTotal();
  }

  actualizarTotal() {
    this.total = this.carrito.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
  }

  enviarACocina() {
    if (this.carrito.length === 0) {
      // Carrito vacío silenciosamente sin notificación visible
      return;
    }
    
    // Marcar que el cliente ya ha pedido
    this.clienteHaPedido = true;
    this.calcularTiempoEstimado(); // Recalcular tiempo ahora que sí hay pedido
    
    const detalles = this.carrito.map(item => ({
      producto: { id: item.producto.id },
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));

    if (this.pedidoExistenteId) {
      // Agregar al pedido existente
      this.pedidoService.agregarAlPedido(this.pedidoExistenteId, detalles).subscribe({
        next: (res) => {
          // AHORA SÍ restringir acceso - solo después de agregar al pedido
          if (!this.isLogged) {
            localStorage.setItem('mesa_acceso', this.mesaId.toString());
            console.log('🔒 Pedido agregado, restringiendo cliente a mesa:', this.mesaId);
          }
          
          // Pedido agregado silenciosamente sin notificación visible
          this.carrito = [];
          this.total = 0;
          if (this.isLogged) {
            this.router.navigate(['/mesas']);
          } else {
            this.cargarProductos(); // Refrescar para ver lo que ya se preparó
          }
        },
        error: (err) => {
          console.error(err);
          // Si el pedido ya no está PENDIENTE (ej. cocinado o cobrado)
          // Pedido cerrado silenciosamente sin notificación visible
          localStorage.removeItem(`pedido_mesa_${this.mesaId}`);
          this.pedidoExistenteId = null;
          this.mensajePedido = '';
        }
      });
    } else {
      // Crear uno completamente nuevo
      const pedidoNuevo = { 
        mesa: { id: this.mesaId }, 
        usuario: { id: 1 }, 
        total: this.total, 
        estado: 'PENDIENTE' 
      };

      this.pedidoService.crearPedido(pedidoNuevo, detalles).subscribe({
        next: (res) => {
          // Guardar el ID recién creado en localStorage para esta mesa específica
          localStorage.setItem(`pedido_mesa_${this.mesaId}`, res.id.toString());
          
          // AHORA SÍ restringir acceso - solo después de enviar el pedido
          if (!this.isLogged) {
            localStorage.setItem('mesa_acceso', this.mesaId.toString());
            console.log('🔒 Pedido enviado, restringiendo cliente a mesa:', this.mesaId);
          }
          
          // Pedido enviado silenciosamente sin notificación visible
          this.carrito = [];
          
          if (this.isLogged) {
            this.router.navigate(['/mesas']);
          } else {
            this.cargarProductos();
          }
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Error', 'Error al enviar el pedido. Verifica la conexión');
        }
      });
    }
  }

  eliminar(i: number) {
    this.carrito.splice(i, 1);
    this.actualizarTotal();
  }

  modificarCantidad(i: number, cambio: number) {
    const item = this.carrito[i];
    item.cantidad += cambio;
    if (item.cantidad <= 0) {
      this.eliminar(i);
    } else {
      this.actualizarTotal();
    }
  }

  getTextoBoton(): string {
    if (!this.pedidoExistenteId) return '🚀 ENVIAR A COCINA';
    return `➕ AGREGAR A MI PEDIDO (#${this.pedidoExistenteId})`;
  }

  cancelarDetalleEnviado(detalleId: number) {
    this.confirmService.confirm({
      title: 'Cancelar Plato',
      message: '¿Deseas cancelar este plato que ya está en cocina?',
      confirmText: 'Cancelar',
      cancelText: 'Mantener',
      type: 'warning'
    }).then(confirmed => {
      if (confirmed) {
        this.pedidoService.eliminarDetalle(detalleId).subscribe({
          next: () => {
            // Plato cancelado silenciosamente sin notificación visible
            this.cargarProductos(); // Refrescar lista de enviados
          },
          error: (err) => {
            console.error(err);
            // Error al cancelar silenciosamente sin notificación visible
          }
        });
      }
    });
  }

  modificarCantidadEnviada(det: any, cambio: number) {
    const nuevaCant = det.cantidad + cambio;
    if (nuevaCant <= 0) {
      this.cancelarDetalleEnviado(det.id);
    } else {
      // Si es un detalle unificado con múltiples IDs originales, necesitamos manejarlo diferente
      if (det.idsOriginales && det.idsOriginales.length > 1) {
        // Para detalles unificados, actualizamos el primer detalle original
        const primerId = det.idsOriginales[0];
        this.pedidoService.actualizarCantidad(primerId, nuevaCant).subscribe({
          next: () => {
            this.cargarProductos(); // Refrescar lista de enviados
          },
          error: (err) => {
            console.error(err);
            this.notificationService.showError('Error', 'No se pudo actualizar la cantidad');
          }
        });
      } else {
        // Para detalles simples, actualizamos normalmente
        this.pedidoService.actualizarCantidad(det.id, nuevaCant).subscribe({
          next: () => {
            this.cargarProductos(); // Refrescar lista de enviados
          },
          error: (err) => {
            console.error(err);
            this.notificationService.showError('Error', 'No se pudo actualizar la cantidad');
          }
        });
      }
    }
  }

  toggleEditar(id: number) {
    if (this.editandoEnviados.has(id)) {
      this.editandoEnviados.delete(id);
    } else {
      this.editandoEnviados.add(id);
    }
  }
}