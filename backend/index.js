const express = require('express');
const cors = require('cors');
const path = require('path');

const usuariosRoutes = require('./routes/usuarios');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/usuarios', usuariosRoutes);

const angularDistPath = path.join(__dirname, '../dist/caixinha/browser');
app.use(express.static(angularDistPath));

app.get('/*', (req, res) => {
  res.sendFile(path.join(angularDistPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});