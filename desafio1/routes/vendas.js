const express = require('express');
const db = require('../db');
const sql = require('../querysql');

const router = express.Router();

// Desconto por cidade do endereço do cliente (req. 5)
function descontoPorCidade(cidade) {
  const c = (cidade || '').trim().toLowerCase();
  if (c === 'curitiba') return 0.10;
  if (c === 'são paulo' || c === 'sao paulo') return 0.05;
  return 0;
}

// Os dois descontos (cidade + valor > R$1000) são cumulativos, aplicados sobre o valor bruto.
function calcularValorTotal(valorBruto, cidade) {
  let desconto = descontoPorCidade(cidade);
  if (valorBruto > 1000) desconto += 0.15;
  return Number((valorBruto * (1 - desconto)).toFixed(2));
}

router.get('/', (req, res) => {
  const vendas = db.prepare(`
    SELECT v.*, p.nome AS produto_nome, c.nome || ' ' || c.sobrenome AS cliente_nome
    FROM vendas v
    JOIN produtos p ON p.id = v.produto_id
    JOIN clientes c ON c.id = v.cliente_id
    ORDER BY v.data_compra DESC
  `).all();
  res.json(vendas);
});

router.post('/', (req, res) => {
  const { cliente_id, produto_id, quantidade } = req.body;
  if (!cliente_id || !produto_id || !quantidade || Number(quantidade) <= 0) {
    return res.status(400).json({ erro: 'cliente_id, produto_id e quantidade (>0) são obrigatórios' });
  }

  const cliente = sql.buscarClientePorId(cliente_id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const produto = sql.buscarProdutoPorId(produto_id);
  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado' });

  const valorBruto = produto.valor * Number(quantidade);
  const valorTotal = calcularValorTotal(valorBruto, cliente.cidade);

  const id = sql.criarVenda({
    produto_id,
    cliente_id,
    quantidade: Number(quantidade),
    valor_total: valorTotal,
  });

  res.status(201).json({ id, valor_bruto: valorBruto, valor_total: valorTotal });
});

router.delete('/:id', (req, res) => {
  sql.deletarVenda(req.params.id);
  res.status(204).end();
});

module.exports = router;
