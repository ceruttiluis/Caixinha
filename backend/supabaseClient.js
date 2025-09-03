require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('✅ Configurando Supabase Client com URL:', supabaseUrl);

try {
  const supabase = createClient(supabaseUrl, anonKey, {
    auth: {
      persistSession: false
    }
  });

   const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });
  console.log('✅ supabase object:', typeof supabase);
  console.log('✅ supabase.from:', typeof supabase.from);
  console.log('✅ supabase.auth:', typeof supabase.auth);

  supabase.from('profiles').select('count').then(response => {
    console.log('✅ Teste de conexão bem-sucedido');
  }).catch(error => {
    console.error('❌ Erro no teste de conexão:', error);
  });

  module.exports = { supabase, supabaseAdmin };
} catch (error) {
  console.error('❌ Erro ao criar cliente Supabase:', error);
  module.exports = null;
}
