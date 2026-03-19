import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PedidoService } from '../../services/pedido.service';
import { MesaService } from '../../services/mesa.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-mesa-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './mesa-cuenta.component.html',
  styleUrls: ['./mesa-cuenta.component.css']
})
export class MesaCuentaComponent implements OnInit {
  mesaId: number = 0;
  productos: any[] = [];
  carritoMesero: any[] = [];
  pedidoActual: any = null;
  totalPedido: number = 0;
  totalCarritoMesero: number = 0;
  granTotal: number = 0;
  categoriaSeleccionada: string = 'TODO';
  private host = '192.168.18.22';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pedidoService: PedidoService,
    private mesaService: MesaService,
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasToken()) {
      this.router.navigate(['/login']);
      return;
    }

    this.mesaId = Number(this.route.snapshot.paramMap.get('mesaId'));
    this.cargarProductos();
    this.cargarPedidoActual();
  }

  cargarProductos() {
    this.http.get<any[]>(`http://${this.host}:8080/api/productos`).subscribe({
      next: (res) => {
        this.productos = res.map(p => {
          let cat = p.categoria ? p.categoria.toUpperCase().trim() : '';
          if (!cat || cat === 'OTROS' || cat === 'NULL') {
            const nombre = p.nombre.toLowerCase();
            if (nombre.includes('ceviche')) cat = 'CEVICHES';
            else if (nombre.includes('marisco') || nombre.includes('jalea') || nombre.includes('arroz')) cat = 'MARISCOS';
            else if (nombre.includes('chicha') || nombre.includes('cerveza') || nombre.includes('gaseosa') || nombre.includes('agua')) cat = 'BEBIDAS';
            else cat = 'TODO';
          }
          const img = p.imagenUrl ? p.imagenUrl : `https://loremflickr.com/320/240/food,${p.nombre.split(' ')[0]}`;
          return { ...p, categoria: cat, imagenUrl: img };
        });
      },
      error: (err) => console.error('Error cargando productos', err)
    });
  }

  cargarPedidoActual() {
    console.log('🔍 Buscando pedido para mesa:', this.mesaId);
    
    // Opción 1: Buscar en todos los pedidos
    this.pedidoService.getPedidos().subscribe({
      next: (pedidos: any[]) => {
        console.log('📋 Todos los pedidos recibidos:', pedidos);
        
        const pedidoActivo = pedidos.find((p: any) => 
          p.mesa?.id === this.mesaId && 
          (p.estado === 'PENDIENTE' || p.estado === 'OCUPADA')
        );
        
        console.log('✅ Pedido encontrado:', pedidoActivo);
        
        if (pedidoActivo) {
          this.pedidoActual = pedidoActivo;
          this.calcularTotales();
        } else {
          // Opción 2: Buscar solo pendientes si el endpoint anterior no funciona
          console.log('🔄 Intentando con endpoint de pendientes...');
          this.pedidoService.getPendientes().subscribe({
            next: (pendientes: any[]) => {
              console.log('📋 Pedidos pendientes:', pendientes);
              
              const pedidoPendiente = pendientes.find((p: any) => 
                p.mesa?.id === this.mesaId
              );
              
              console.log('✅ Pedido pendiente encontrado:', pedidoPendiente);
              
              if (pedidoPendiente) {
                this.pedidoActual = pedidoPendiente;
                this.calcularTotales();
              } else {
                console.log('❌ No se encontró ningún pedido para esta mesa');
                this.pedidoActual = null;
                this.calcularTotales();
              }
            },
            error: (err: any) => {
              console.error('❌ Error cargando pendientes:', err);
              this.pedidoActual = null;
              this.calcularTotales();
            }
          });
        }
      },
      error: (err: any) => {
        console.error('❌ Error cargando todos los pedidos:', err);
        console.log('🔄 Intentando con endpoint de pendientes...');
        
        // Fallback: usar solo pendientes
        this.pedidoService.getPendientes().subscribe({
          next: (pendientes: any[]) => {
            console.log('📋 Pedidos pendientes (fallback):', pendientes);
            
            const pedidoPendiente = pendientes.find((p: any) => 
              p.mesa?.id === this.mesaId
            );
            
            console.log('✅ Pedido pendiente encontrado (fallback):', pedidoPendiente);
            
            if (pedidoPendiente) {
              this.pedidoActual = pedidoPendiente;
              this.calcularTotales();
            } else {
              console.log('❌ No se encontró ningún pedido para esta mesa');
              this.pedidoActual = null;
              this.calcularTotales();
            }
          },
          error: (err: any) => {
            console.error('❌ Error en fallback:', err);
            this.pedidoActual = null;
            this.calcularTotales();
          }
        });
      }
    });
  }

  productosFiltrados() {
    if (this.categoriaSeleccionada === 'TODO') return this.productos;
    return this.productos.filter(p => p.categoria === this.categoriaSeleccionada);
  }

  agregarAlCarritoMesero(p: any) {
    const existe = this.carritoMesero.find(item => item.producto.id === p.id);
    if (existe) {
      existe.cantidad++;
    } else {
      this.carritoMesero.push({
        producto: { id: p.id, nombre: p.nombre },
        cantidad: 1,
        precioUnitario: p.precio
      });
    }
    this.calcularTotales();
  }

  eliminarDelCarritoMesero(i: number) {
    this.carritoMesero.splice(i, 1);
    this.calcularTotales();
  }

  modificarCantidadMesero(i: number, cambio: number) {
    const item = this.carritoMesero[i];
    item.cantidad += cambio;
    if (item.cantidad <= 0) {
      this.eliminarDelCarritoMesero(i);
    } else {
      this.calcularTotales();
    }
  }

  calcularTotales() {
    // Total del pedido existente
    this.totalPedido = this.pedidoActual?.total || 0;
    
    // Total del carrito del mesero
    this.totalCarritoMesero = this.carritoMesero.reduce(
      (acc, item) => acc + (item.precioUnitario * item.cantidad), 0
    );
    
    // Gran total
    this.granTotal = this.totalPedido + this.totalCarritoMesero;
  }

  enviarAdicionales() {
    if (this.carritoMesero.length === 0) {
      // Carrito vacío silenciosamente sin notificación visible
      return;
    }

    if (!this.pedidoActual) {
      this.notificationService.showError('Sin Pedido', 'No hay un pedido activo para esta mesa');
      return;
    }

    const detalles = this.carritoMesero.map(item => ({
      producto: { id: item.producto.id },
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario
    }));

    this.pedidoService.agregarAlPedido(this.pedidoActual.id, detalles).subscribe({
      next: (res) => {
        this.notificationService.showSuccess('Adicionales Agregados', 'Adicionales agregados a la cuenta');
        this.carritoMesero = [];
        this.cargarPedidoActual(); // Refrescar el pedido
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('Error', 'Error al agregar adicionales');
      }
    });
  }

  imprimirBoleta() {
    if (!this.pedidoActual) {
      this.notificationService.showError('Sin Pedido', 'No hay un pedido activo para imprimir');
      return;
    }

    // Crear una ventana de impresión con la boleta
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) {
      this.notificationService.showError('Error', 'Por favor, permite las ventanas emergentes para imprimir');
      return;
    }

    const htmlBoleta = this.generarHTMLBoleta();
    ventanaImpresion.document.write(htmlBoleta);
    ventanaImpresion.document.close();
    ventanaImpresion.print();
  }

  generarHTMLBoleta(): string {
    const fecha = new Date().toLocaleString('es-PE');
    const detalles = this.pedidoActual.detalles || [];
    
    let htmlDetalles = '';
    detalles.forEach((det: any) => {
      const subtotal = det.cantidad * det.precioUnitario;
      htmlDetalles += `
        <tr>
          <td>${det.producto?.nombre || 'Producto'}</td>
          <td>${det.cantidad}</td>
          <td>S/ ${det.precioUnitario?.toFixed(2) || '0.00'}</td>
          <td>S/ ${subtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    // Agregar items del carrito del mesero si hay
    this.carritoMesero.forEach(item => {
      const subtotal = item.cantidad * item.precioUnitario;
      htmlDetalles += `
        <tr style="background-color: #f0f8ff;">
          <td>${item.producto.nombre} (NUEVO)</td>
          <td>${item.cantidad}</td>
          <td>S/ ${item.precioUnitario.toFixed(2)}</td>
          <td>S/ ${subtotal.toFixed(2)}</td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Boleta - Mesa ${this.mesaId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { color: #2c3e50; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total { font-size: 18px; font-weight: bold; text-align: right; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🍽️ PICANTERÍA</h1>
          <h2>BOLETA DE VENTA</h2>
        </div>
        
        <div class="info">
          <p><strong>Mesa:</strong> ${this.mesaId}</p>
          <p><strong>Pedido #:</strong> ${this.pedidoActual.id}</p>
          <p><strong>Fecha y Hora:</strong> ${fecha}</p>
          <p><strong>Mesero:</strong> ${this.authService.getCurrentUser() || 'Sistema'}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${htmlDetalles}
          </tbody>
        </table>
        
        <div class="total">
          <p>TOTAL: S/ ${this.granTotal.toFixed(2)}</p>
        </div>
        
        <div class="footer">
          <p>¡Gracias por su visita!</p>
          <p>Picantería Web - Sistema de Pedidos</p>
        </div>
      </body>
      </html>
    `;
  }

  volverAMesas() {
    this.router.navigate(['/mesas']);
  }

  iniciarPedidoCliente() {
    this.router.navigate(['/nuevo-pedido', this.mesaId]);
  }

  editarItem(detalle: any) {
    const nuevaCantidad = prompt(`Editar cantidad para "${detalle.producto?.nombre}":`, detalle.cantidad);
    if (nuevaCantidad && !isNaN(Number(nuevaCantidad)) && Number(nuevaCantidad) > 0) {
      this.pedidoService.actualizarCantidad(detalle.id, Number(nuevaCantidad)).subscribe({
        next: () => {
          this.notificationService.showSuccess('Cantidad Actualizada', 'Cantidad actualizada');
          this.cargarPedidoActual(); // Refrescar
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Error', 'No se pudo actualizar la cantidad');
        }
      });
    }
  }
}
