const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

const supabaseJwtSecret = 'https://cbymtecijykciwtmpglp.supabase.co'; // copiado do Supabase

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    // Decodifica e verifica assinatura com chave do Supabase
    const decoded = jwt.verify(token, supabaseJwtSecret);

    // Opcional: buscar usuário no banco e anexar no request
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (error || !usuario) {
      return res.status(403).json({ error: 'Usuário inválido' });
    }

    req.user = usuario; // Anexa usuário no request
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authenticateToken;