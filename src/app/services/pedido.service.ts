import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private host = window.location.hostname;  // Backend en Downloads
  private API_URL = `http://${this.host}:8080/api/pedidos`;

  constructor(private http: HttpClient) { }

  crearPedido(pedido: any, detalles: any[]): Observable<any> {
    const body = { 
      pedido: pedido, 
      detalles: detalles 
    }; 
    return this.http.post<any>(`${this.API_URL}/crear`, body);
  }

  agregarAlPedido(pedidoId: number, detalles: any[]): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${pedidoId}/agregar`, detalles);
  }

  getPedidoById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  getPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/pendientes`);
  }

  marcarComoListo(id: number): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}/listo`, {});
  }

  eliminarDetalle(detalleId: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/detalle/${detalleId}`);
  }

  actualizarCantidad(detalleId: number, nuevaCantidad: number): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/detalle/${detalleId}/cantidad/${nuevaCantidad}`, {});
  }

  getPedidos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}`);
  }
}