const express = require('express');
const path = require('path');

const clientesRouter = require('./routes/clientes');
const produtosRouter = require('./routes/produtos');
const vendasRouter = require('./routes/vendas');
const relatoriosRouter = require('./routes/relatorios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/clientes', clientesRouter);
app.use('/api/produtos', produtosRouter);
app.use('/api/vendas', vendasRouter);
app.use('/api/relatorios', relatoriosRouter);

app.use((err, req, res, next) => {
  res.status(400).json({ erro: err.message || 'Erro inesperado' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
