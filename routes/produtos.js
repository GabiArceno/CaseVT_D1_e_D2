const express = require('express');
const sql = require('../querysql');

const router = express.Router();

function validarProduto(body) {
  for (const campo of ['codigo', 'nome', 'valor']) {
    if (body[campo] === undefined || body[campo] === null || String(body[campo]).trim() === '') {
      return `Campo obrigatório ausente: ${campo}`;
    }
  }
  if (isNaN(Number(body.valor)) || Number(body.valor) <= 0) {
    return 'Valor do produto deve ser um número positivo';
  }
  return null;
}

router.get('/', (req, res) => {
  res.json(sql.listarProdutos());
});

router.get('/:id', (req, res) => {
  const produto = sql.buscarProdutoPorId(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });
  res.json(produto);
});

router.post('/', (req, res) => {
  const erro = validarProduto(req.body);
  if (erro) return res.status(400).json({ erro });
  try {
    const { codigo, nome, descricao, valor } = req.body;
    const id = sql.criarProduto({ codigo, nome, descricao, valor: Number(valor) });
    res.status(201).json(sql.buscarProdutoPorId(id));
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ erro: 'Já existe um produto com esse código' });
    }
    res.status(500).json({ erro: 'Erro ao cadastrar produto' });
  }
});

router.put('/:id', (req, res) => {
  const erro = validarProduto(req.body);
  if (erro) return res.status(400).json({ erro });
  const existente = sql.buscarProdutoPorId(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });
  const { codigo, nome, descricao, valor } = req.body;
  sql.atualizarProduto(req.params.id, { codigo, nome, descricao, valor: Number(valor) });
  res.json(sql.buscarProdutoPorId(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existente = sql.buscarProdutoPorId(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado' });
  sql.deletarProduto(req.params.id);
  res.status(204).end();
});

module.exports = router;
