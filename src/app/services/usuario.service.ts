import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private host = '192.168.18.22';
  private API_URL = `http://${this.host}:8080/api/usuarios`;

  constructor(private http: HttpClient) { }

  listarUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(this.API_URL);
  }

  crearUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(this.API_URL, usuario);
  }

  actualizarUsuario(id: number, usuario: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }
}
