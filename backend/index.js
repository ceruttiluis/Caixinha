const express = require('express');
const cors = require('cors');
const path = require('path');
const authenticateToken = require('./authMiddleware');

const usuariosRoutes = require('./routes/usuarios');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Teste OK - Servidor funcionando', timestamp: new Date() });
});

app.post('/api/test-auth', authenticateToken, (req, res) => {
  console.log(' Rota de teste com auth atingida!');
  res.json({ message: 'Teste Auth OK', user: req.user });
});

app.use('/api/profiles', authenticateToken, usuariosRoutes);

const angularDistPath = path.join(__dirname, '../dist/caixinha/browser');
app.use(express.static(angularDistPath));

app.get('/*', (req, res) => {
  res.sendFile(path.join(angularDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});