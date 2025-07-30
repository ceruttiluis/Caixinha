const express = require('express');
const router = express.Router();
const supabase = require('../supabaseClient');
const authenticateToken = require('../authMiddleware');

router.use(authenticateToken);
// GET - listar todos usuários
router.get('/', async (req, res) => {
  const usuario = req.user;

  let query = supabase.from('usuarios').select('id, nome, role, filial_id');

  if (usuario.role === 'CIOP') {
    // Ver todos
  } else if (usuario.role === 'GERENTE') {
    // Ver usuários da sua filial
    query = query.eq('filial_id', usuario.filial_id);
  } else {
    // Colaborador vê só ele
    query = query.eq('id', usuario.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// POST - criar novo usuário
router.post('/', async (req, res) => {
  const { nome, role, filial_id, gerente_id, auth_user_id } = req.body;

  // 1. Criar usuário no auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    user_metadata: { nome },
    email: `${Date.now()}@fakeemail.com`, // e-mail opcional para testes
    password: 'SenhaForte123',            // defina lógica real
    id: auth_user_id                      // opcional: use ID específico
  });

  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  const { id: novoUserId } = authUser.user;

  // 2. Criar entrada na tabela 'usuarios'
  const { error } = await supabase.from('usuarios').insert([{
    id: novoUserId,
    nome,
    role,
    filial_id,
    gerente_id: role === 'COLABORADOR' ? gerente_id : null
  }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(201).json({ id: novoUserId });
});

// DELETE - remover usuário (do auth e da tabela)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  // 1. Remover do Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) {
    return res.status(500).json({ error: authError.message });
  }

  // 2. Excluir da tabela 'usuarios' (opcional, pois cascade já faz)
  await supabase.from('usuarios').delete().eq('id', id);

  res.status(204).send();
});

module.exports = router;