const express = require('express');
const cors = require('cors');
const usuariosRoutes = require('./routes/usuarios');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/usuarios', usuariosRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});