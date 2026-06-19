const express = require('express');
const sql = require('../querysql');

const router = express.Router();

router.get('/clientes', (req, res) => res.json(sql.listarClientes()));
router.get('/clientes-por-cidade', (req, res) => res.json(sql.clientesPorCidade()));
router.get('/total-vendas-por-cliente', (req, res) => res.json(sql.totalVendasPorCliente()));
router.get('/media-vendas-mes', (req, res) => res.json(sql.mediaVendasPorMes()));
router.get('/cidade-mais-vendas', (req, res) => res.json(sql.cidadeComMaisVendas() || {}));

module.exports = router;
