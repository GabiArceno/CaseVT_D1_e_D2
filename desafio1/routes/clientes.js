const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sql = require('../querysql');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.mimetype)) {
      return cb(new Error('Formato de imagem inválido'));
    }
    cb(null, true);
  },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONE_RE = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;
const CAMPOS_OBRIGATORIOS = ['nome', 'sobrenome', 'data_nascimento', 'telefone', 'email', 'cep'];

function validarCliente(body) {
  for (const campo of CAMPOS_OBRIGATORIOS) {
    if (!body[campo] || !String(body[campo]).trim()) {
      return `Campo obrigatório ausente: ${campo}`;
    }
  }
  if (!EMAIL_RE.test(body.email)) return 'E-mail em formato inválido';
  if (!TELEFONE_RE.test(body.telefone)) return 'Telefone em formato inválido';
  return null;
}

router.get('/', (req, res) => {
  res.json(sql.listarClientesComVendas());
});

router.get('/:id', (req, res) => {
  const cliente = sql.buscarClientePorId(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  res.json({ ...cliente, compras: sql.listarVendasPorCliente(req.params.id) });
});

router.post('/', upload.single('foto'), (req, res) => {
  const erro = validarCliente(req.body);
  if (erro) return res.status(400).json({ erro });

  const { nome, sobrenome, data_nascimento, telefone, email, cep, rua, bairro, cidade, estado } = req.body;
  const endereco_id = sql.criarEndereco({ cep, rua, bairro, cidade, estado });
  const foto_path = req.file ? `/uploads/${req.file.filename}` : null;
  const id = sql.criarCliente({ nome, sobrenome, data_nascimento, telefone, email, endereco_id, foto_path });
  res.status(201).json(sql.buscarClientePorId(id));
});

router.put('/:id', upload.single('foto'), (req, res) => {
  const erro = validarCliente(req.body);
  if (erro) return res.status(400).json({ erro });

  const existente = sql.buscarClientePorId(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Cliente não encontrado' });

  const { nome, sobrenome, data_nascimento, telefone, email, cep, rua, bairro, cidade, estado } = req.body;

  if (req.file && existente.foto_path) {
    const caminhoAntigo = path.join(uploadsDir, path.basename(existente.foto_path));
    fs.unlink(caminhoAntigo, () => {});
  }
  const foto_path = req.file ? `/uploads/${req.file.filename}` : null;

  sql.atualizarEndereco(existente.endereco_id, { cep, rua, bairro, cidade, estado });
  sql.atualizarCliente(req.params.id, { nome, sobrenome, data_nascimento, telefone, email, foto_path });
  res.json(sql.buscarClientePorId(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existente = sql.buscarClientePorId(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Cliente não encontrado' });
  if (existente.foto_path) {
    fs.unlink(path.join(uploadsDir, path.basename(existente.foto_path)), () => {});
  }
  sql.deletarCliente(req.params.id);
  res.status(204).end();
});

module.exports = router;
