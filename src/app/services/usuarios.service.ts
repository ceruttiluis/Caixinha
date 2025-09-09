import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: string;
  name: string;
  email: string;
  role: string;
  filial_id: string;
  gerente_id?: string | null;
  carteira?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = 'http://localhost:3000/api/profiles';

  constructor(private http: HttpClient) {
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  criarUsuario(usuario: Usuario & { password: string }): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.post<Usuario>(this.apiUrl, usuario,{
       headers: this.getAuthHeaders()
    })
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  excluirUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`,{
      headers: this.getAuthHeaders()
    });
  }
  atualizarUsuario(id: string, dados: Partial<Usuario>): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.apiUrl}/${id}`, dados, {
    headers: this.getAuthHeaders()
  });
  }
}