import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MesaService {
  // Detecta automáticamente la IP del servidor (Backend en Downloads)
  private host = window.location.hostname; 
  private API_URL = `http://${this.host}:8080/api/mesas`;

  constructor(private http: HttpClient) { }

  getMesas(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  cambiarEstado(id: number, estado: string): Observable<string> {
    const accion = estado === 'LIBRE' ? 'liberar' : 'ocupar';
    return this.http.get(`${this.API_URL}/${id}/${accion}`, { responseType: 'text' });
  }
}