import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  filial_id?: string; // Opcional se nem todos usuários tiverem
  name?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private supabase: SupabaseClient;
  
  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }
  private roleMapping: {[key: string]: string} = {
  'admin': 'CIOP', // Mapeia 'admin' do banco para 'CIOP' no front
  'gerente': 'GERENTE',
  'colaborador': 'COLABORADOR'
};
  
  async login(email: string, password: string): Promise<{role: string}> {
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({ 
    email, 
    password 
  });

  if (authError) {
    console.error('Erro na autenticação:', authError);
    throw authError;
  }

  console.log('Auth success. User ID:', authData.user?.id);

  // 2. Buscar perfil
  const { data: profile, error: profileError } = await this.supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user?.id)
    .single();

    const frontendRole = this.roleMapping[profile?.role?.toLowerCase()] || 'COLABORADOR';
  
  console.log('Resultado da busca de perfil:', { profile, profileError });

  if (profileError) {
    console.error('Erro ao buscar perfil:', profileError);
    throw profileError;
  }

  if (!profile) {
    console.error('Perfil não encontrado para user ID:', authData.user?.id);
    throw new Error('Perfil não encontrado');
  }

  const userData = {
    ...authData.user,
    role: frontendRole, // Fallback seguro
    filial_id: profile || null
  };

  console.log('Dados completos do usuário:', userData);
  
  localStorage.setItem('token', authData.session.access_token);
  localStorage.setItem('user', JSON.stringify(userData));

  return userData;
}
async signUp(email: string, password: string) {
  // 1. Registrar no Auth
  const { data: authData, error: authError } = await this.supabase.auth.signUp({
    email,
    password
  });

  if (authError) throw authError;

  // 2. Criar perfil com role padrão
  const { error: profileError } = await this.supabase
    .from('profiles')
    .insert([{
      id: authData.user?.id,
      email,
      role: 'user' // Valor padrão
    }]);

  if (profileError) throw profileError;
}

  logout(): void {
    this.supabase.auth.signOut();
    localStorage.removeItem('token');
  }

async getRole(): Promise<string | null> {
  const userData = localStorage.getItem('user');
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    return parsed.role || null;
  } catch (e) {
    console.error('Erro ao fazer parse de user no localStorage:', e);
    return null;
  }
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