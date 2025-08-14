import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  filial_id?: string; 
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
  'moderator': 'GERENTE',
  'user': 'COLABORADOR'
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

getRoleSync(): string | null {
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