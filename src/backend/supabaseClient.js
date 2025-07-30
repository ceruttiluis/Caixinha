const { createClient } = require('@supabase/supabase-js');

// Coloque suas chaves aqui (use variáveis de ambiente no futuro)
const supabaseUrl = 'https://cbymtecijykciwtmpglp.supabase.co';
const supabaseKey = 'SUPABASE_SERVICE_ROLE_KEY'; // use a chave segura (não pública do frontend)

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;