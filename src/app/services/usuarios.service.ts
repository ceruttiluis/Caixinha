import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id?: string;
  nome: string;
  email: string;
  role: string;
  filial_id: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private apiUrl = '/api/usuarios'; // ou só '/api/usuarios' se usar proxy

  constructor(private http: HttpClient) {}

  // GET - listar usuários
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  // POST - criar novo usuário
  criarUsuario(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, usuario);
  }

  // DELETE - remover usuário por ID
  deletarUsuario(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}