import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
  
  async login(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (data.session?.access_token) {
      localStorage.setItem('token', data.session.access_token);
    }
  }

  logout(): void {
    this.supabase.auth.signOut();
    localStorage.removeItem('token');
  }

  getRole(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded?.user_metadata?.role || null;
  }

  getUserId(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded?.sub || null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
  getFilialId(): string | null {
  const userData = localStorage.getItem('user');
  if (!userData) return null;

  const parsed = JSON.parse(userData);
  return parsed?.filial_id || null;
}
}