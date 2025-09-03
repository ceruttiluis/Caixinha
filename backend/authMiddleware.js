const jwt = require('jsonwebtoken');
const { supabase } = require('./supabaseClient');

const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader?.startsWith('')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = jwt.verify(token, supabaseJwtSecret);
    
    const { data: usuario, error} = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.sub)
      .single();

console.log('🔍 ID buscado (trimmed):', `"${decoded.sub.trim()}"`);
console.log('🔍 Tamanho do ID:', decoded.sub.trim().length);
console.log('🔍 Resultado completo:', { usuario, error });

    if ( error || !usuario) {
      return res.status(403).json({ error: 'Usuário inválido' });
    }

    req.user = usuario;
    next();
  } catch (err) {
    console.error('❌ Erro na autenticação:', err);
    return res.status(403).json({ error: 'Erro na autenticação' });
  }
}

module.exports = authenticateToken;