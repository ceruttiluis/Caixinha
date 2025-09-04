const jwt = require('jsonwebtoken');
const { supabase } = require('./supabaseClient');

const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = jwt.verify(token, supabaseJwtSecret);
    const userId = String(decoded.sub).trim();

    const { data: usuario, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erro na consulta do usuário:', error);

      if (error.code === 'PGRST116') {
        return res.status(403).json({ error: 'Usuário não encontrado no banco de dados' });
      }

      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (!usuario) {
      return res.status(403).json({ error: 'Usuário não encontrado' });
    }


    req.user = usuario;
    next();
  } catch (err) {
    console.error(' Erro na autenticação:', err);
    return res.status(403).json({ error: 'Erro na autenticação' });
  }
}

module.exports = authenticateToken;