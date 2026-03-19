import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService } from '../../services/pedido.service';

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.css']
})
export class CocinaComponent implements OnInit, OnDestroy {
  pedidosPendientes: any[] = [];
  intervalo: any;

  constructor(private pedidoService: PedidoService) { }

  ngOnInit(): void {
    this.cargarPedidos();
    // Revisa si hay pedidos nuevos automáticamente cada 10 segundos
    this.intervalo = setInterval(() => this.cargarPedidos(), 10000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) clearInterval(this.intervalo);
  }

  cargarPedidos() {
    // Agregamos : any para que TypeScript no se queje del tipo de dato
    this.pedidoService.getPendientes().subscribe({
      next: (data: any) => this.pedidosPendientes = data,
      error: (err: any) => console.error('Error en cocina:', err)
    });
  }

  terminarPedido(id: number) {
    // Agregamos : any para manejar el error correctamente
    this.pedidoService.marcarComoListo(id).subscribe({
      next: () => {
        this.pedidosPendientes = this.pedidosPendientes.filter(p => p.id !== id);
        console.log('Pedido entregado');
      },
      error: (err: any) => console.error('Error al finalizar pedido', err)
    });
  }
}