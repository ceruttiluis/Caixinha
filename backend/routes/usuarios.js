const express = require('express');
const router = express.Router();
const authenticateToken = require('../authMiddleware');
const { supabase, supabaseAdmin } = require('../supabaseClient');

router.use(authenticateToken);

router.get('/', async (req, res) => {
  const usuario = req.user;

  let query = supabase
    .from('profiles')
    .select('id, name, role');

  if (usuario.role === 'admin') {
  } else if (usuario.role === 'moderator') {
    query = query.eq('filial_id', usuario.filial_id);
  } else {
    query = query.eq('id', usuario.id);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

router.put('/:id', async (req, res) => {
  try {
  const { id } = req.params;
  const { name, role, filial_id, gerente_id } = req.body;

  const { data, error } = await supabase
    .from('profiles')
    .update({
      name,
      role,
      filial_id,
      gerente_id
    })
    .eq('id', id)
    .select()
    .single();

   if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

router.post('/', async (req, res) => {
  console.log('✅ Rota POST /api/profiles atingida!');
  console.log('📦 Body recebido:', req.body);
  console.log('👤 Usuário autenticado:', req.user);
  const { name, role, filial_id, gerente_id, email, password } = req.body;

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role, },
  });

  if (authError) return res.status(500).json({ error: authError.message });

  const novoUserId = authUser.user.id;

  const { error: insertError } = await supabase.from('profiles').insert([{
    id: novoUserId,
    email,
    name,
    role,
    filial_id,
    carteira: 0,
    gerente_id: role === 'moderator' ? gerente_id : null
  }]);

 if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(novoUserId);
      return res.status(500).json({ error: insertError.message });
    }

  res.status(201).json({ id: novoUserId });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error: authError } = await supabase.auth.admin.deleteUser(id);
  if (authError) return res.status(500).json({ error: authError.message });

  await supabase.from('profiles').delete().eq('id', id);

  res.status(204).send();
});

module.exports = router;