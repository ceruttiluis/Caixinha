const jwt = require('jsonwebtoken');
const supabase = require('./supabaseClient');

const supabaseJwtSecret = 'RbgNi6kjKY/f8Im025nLPMEuvgjYyQ7E/n5mUfY6NFVl2BC6L6MimNaonIEXotsCpVHE1QA4KFzk00D/LBEyaA=='; // copiado do Supabase

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, supabaseJwtSecret);

    const { data: usuario, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.sub)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Usuário inválido' });
    }

    req.user = profile;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authenticateToken;