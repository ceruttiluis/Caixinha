const express = require('express');
const router = express.Router();
const authenticateToken = require('../authMiddleware');
const { supabase, supabaseAdmin } = require('../supabaseClient');

router.use(authenticateToken);

// GET - listar todos usuários
router.get('/', async (req, res) => {
  const usuario = req.user;

  let query = supabase.from('usuarios').select('id, nome, role, filial_id');

  if (usuario.role === 'CIOP') {
    // Ver todos
  } else if (usuario.role === 'GERENTE') {
    query = query.eq('filial_id', usuario.filial_id);
  } else {
    query = query.eq('id', usuario.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// POST - criar novo usuário
router.post('/', async (req, res) => {
  const { nome, role, filial_id, gerente_id, auth_user_id, email, password } = req.body;

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'ciop@teste.com',
    password: 'SenhaForte123',
    user_metadata: { nome: 'CIOP', role: 'admin' },
    id: auth_user_id
  });

  if (authError) return res.status(500).json({ error: authError.message });

  await supabase.from('profiles').update({ role: 'admin' }).eq('email', 'ciop@teste.com');

  const novoUserId = authUser.user.id;

  const { error: insertError } = await supabase.from('profiles').insert([{
    id: novoUserId,
    nome: 'admin',
    role: 'admin',
    filial_id,
    gerente_id: role === 'CIOP' ? gerente_id : null
  }]);

  if (insertError) return res.status(500).json({ error: insertError.message });

  res.status(201).json({ id: novoUserId });
});

// DELETE - remover usuário
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) return res.status(500).json({ error: authError.message });

  await supabase.from('usuarios').delete().eq('id', id);

  res.status(204).send();
});

module.exports = router;