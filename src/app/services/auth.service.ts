import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { supabase } from '../services/supabaseClient';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  private roleMapping: { [key: string]: string } = {
    'admin': 'CIOP',
    'moderator': 'GERENTE',
    'user': 'COLABORADOR',
    'dp': 'DP'
  };

  async login(email: string, password: string): Promise<{ role: string }> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Erro na autenticação:', authError);
      throw authError;
    }

    console.log('Auth success. User ID:', authData.user?.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, filial_id')
      .eq('id', authData.user?.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Perfil não encontrado');

    const frontendRole = this.roleMapping[profile.role?.toLowerCase()] || 'COLABORADOR';

    const userData = {
      ...authData.user,
      role: frontendRole,
      filial_id: profile.filial_id || null
    };

    if (this.isBrowser) {
      localStorage.setItem('token', authData.session.access_token);
      localStorage.setItem('user', JSON.stringify(userData));
    }

    return userData;
  }
  async signUp(email: string, password: string) {

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) throw authError;


    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user?.id,
        email,
        role: 'user'
      }]);
    if (profileError) throw profileError;
  }

  logout(): void {
    supabase.auth.signOut();
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  getRoleSync(): string | null {
    if (!this.isBrowser) return null;
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    try {
      const parsed = JSON.parse(userData);
      return parsed.role || null;
    } catch {
      return null;
    }
  }

  getUserId(): string | null {
    if (!this.isBrowser) return null;
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded: any = jwtDecode(token);
    return decoded?.sub || null;
  }

  isAuthenticated(): boolean {
    return this.isBrowser && !!localStorage.getItem('token');
  }
  getFilialId(): string | null {
    if (!this.isBrowser) return null;
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    const parsed = JSON.parse(userData);
    return parsed?.filial_id || null;
  }
}