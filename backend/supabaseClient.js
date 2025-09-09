require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

try {
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false
    }
  });

  supabase.from('profiles').select('count').then(response => {
  }).catch(error => {
    console.error(' Erro no teste de conexão:', error);
  });

  module.exports = { supabase, supabaseAdmin };
} catch (error) {
  console.error(' Erro ao criar cliente Supabase:', error);
  module.exports = null;
}
