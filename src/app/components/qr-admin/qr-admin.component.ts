import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QRCodeModule } from 'angularx-qrcode';
import { MesaService } from '../../services/mesa.service';

@Component({
  selector: 'app-qr-admin',
  standalone: true,
  imports: [CommonModule, QRCodeModule],
  templateUrl: './qr-admin.component.html',
  styleUrls: ['./qr-admin.component.css']
})
export class QrAdminComponent implements OnInit {
  mesas: any[] = [];
  baseUrl: string = '';

  constructor(private mesaService: MesaService) {}

  ngOnInit(): void {
    // Sistema automático: detectar y fijar URL para siempre
    this.fijarUrlAutomaticamente();
    
    this.mesaService.getMesas().subscribe({
      next: (data) => this.mesas = data,
      error: (err) => console.error('Error al cargar mesas:', err)
    });
  }

  fijarUrlAutomaticamente(): void {
    // Usar la IP real correcta: 192.168.18.22
    const urlActual = `http://192.168.18.22:4200`;
    this.baseUrl = urlActual;
    
    console.log('🔧 URL base para QRs:', urlActual);
    console.log('🔧 Los clientes escanearán:', urlActual);
    console.log('🔧 Timestamp:', new Date().toISOString()); 
  }

  getQrUrl(mesaId: number): string {
    // Generar URL directa para hacer pedido (no al mapa de mesas)
    const url = `${this.baseUrl}/nuevo-pedido/${mesaId}`;
    console.log('🔧 QR URL generada para mesa', mesaId, ':', url);
    console.log('🔧 baseUrl actual:', this.baseUrl);
    return url;
  }

  imprimir(): void {
    window.print();
  }
}
