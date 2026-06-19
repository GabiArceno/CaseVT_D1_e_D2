const db = require('./db');


function criarEndereco({ cep, rua, bairro, cidade, estado }) {
  const stmt = db.prepare(
    'INSERT INTO enderecos (cep, rua, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?)'
  );
  const info = stmt.run(cep, rua, bairro, cidade, estado);
  return info.lastInsertRowid;
}

function atualizarEndereco(id, { cep, rua, bairro, cidade, estado }) {
  db.prepare(
    'UPDATE enderecos SET cep = ?, rua = ?, bairro = ?, cidade = ?, estado = ? WHERE id = ?'
  ).run(cep, rua, bairro, cidade, estado, id);
}

function criarCliente({ nome, sobrenome, data_nascimento, telefone, email, endereco_id, foto_path }) {
  const stmt = db.prepare(`
    INSERT INTO clientes (nome, sobrenome, data_nascimento, telefone, email, endereco_id, foto_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(nome, sobrenome, data_nascimento, telefone, email, endereco_id, foto_path || null);
  return info.lastInsertRowid;
}

function atualizarCliente(id, { nome, sobrenome, data_nascimento, telefone, email, foto_path }) {
  if (foto_path) {
    db.prepare(`
      UPDATE clientes SET nome = ?, sobrenome = ?, data_nascimento = ?, telefone = ?, email = ?, foto_path = ?
      WHERE id = ?
    `).run(nome, sobrenome, data_nascimento, telefone, email, foto_path, id);
  } else {
    db.prepare(`
      UPDATE clientes SET nome = ?, sobrenome = ?, data_nascimento = ?, telefone = ?, email = ?
      WHERE id = ?
    `).run(nome, sobrenome, data_nascimento, telefone, email, id);
  }
}

function deletarCliente(id) {
  db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
}

function buscarClientePorId(id) {
  return db.prepare(`
    SELECT c.*, e.cep, e.rua, e.bairro, e.cidade, e.estado
    FROM clientes c JOIN enderecos e ON e.id = c.endereco_id
    WHERE c.id = ?
  `).get(id);
}


function listarClientes() {
  return db.prepare(`
    SELECT c.id, c.nome, c.sobrenome, c.data_nascimento, c.telefone, c.email,
           c.foto_path, c.criado_em,
           e.cep, e.rua, e.bairro, e.cidade, e.estado
    FROM clientes c
    JOIN enderecos e ON e.id = c.endereco_id
    ORDER BY c.id DESC
  `).all();
}


function listarClientesComVendas() {
  return db.prepare(`
    SELECT c.id, c.nome, c.sobrenome, c.data_nascimento, c.telefone, c.email,
           c.foto_path, c.criado_em,
           e.cep, e.rua, e.bairro, e.cidade, e.estado,
           COUNT(v.id) AS total_compras,
           COALESCE(SUM(v.valor_total), 0) AS total_gasto
    FROM clientes c
    JOIN enderecos e ON e.id = c.endereco_id
    LEFT JOIN vendas v ON v.cliente_id = c.id
    GROUP BY c.id
    ORDER BY c.id DESC
  `).all();
}


function criarProduto({ codigo, nome, descricao, valor }) {
  const stmt = db.prepare(`
    INSERT INTO produtos (codigo, nome, descricao, valor) VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(codigo, nome, descricao, valor);
  return info.lastInsertRowid;
}

function atualizarProduto(id, { codigo, nome, descricao, valor }) {
  db.prepare(`
    UPDATE produtos SET codigo = ?, nome = ?, descricao = ?, valor = ? WHERE id = ?
  `).run(codigo, nome, descricao, valor, id);
}

function deletarProduto(id) {
  db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
}

function listarProdutos() {
  return db.prepare('SELECT * FROM produtos ORDER BY id DESC').all();
}

function buscarProdutoPorId(id) {
  return db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
}


function criarVenda({ produto_id, cliente_id, quantidade, valor_total }) {
  const stmt = db.prepare(`
    INSERT INTO vendas (produto_id, cliente_id, quantidade, valor_total) VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(produto_id, cliente_id, quantidade, valor_total);
  return info.lastInsertRowid;
}

function deletarVenda(id) {
  db.prepare('DELETE FROM vendas WHERE id = ?').run(id);
}

function listarVendasPorCliente(cliente_id) {
  return db.prepare(`
    SELECT v.*, p.nome AS produto_nome, p.codigo AS produto_codigo
    FROM vendas v JOIN produtos p ON p.id = v.produto_id
    WHERE v.cliente_id = ?
    ORDER BY v.data_compra DESC
  `).all(cliente_id);
}




function clientesPorCidade() {
  return db.prepare(`
    SELECT e.cidade, COUNT(c.id) AS quantidade
    FROM clientes c JOIN enderecos e ON e.id = c.endereco_id
    GROUP BY e.cidade
    ORDER BY quantidade DESC
  `).all();
}


function totalVendasPorCliente() {
  return db.prepare(`
    SELECT c.id AS cliente_id, c.nome || ' ' || c.sobrenome AS cliente,
           COALESCE(SUM(v.valor_total), 0) AS total_vendido
    FROM clientes c
    LEFT JOIN vendas v ON v.cliente_id = c.id
    GROUP BY c.id
    ORDER BY total_vendido DESC
  `).all();
}


function mediaVendasPorMes() {
  return db.prepare(`
    SELECT strftime('%Y-%m', data_compra) AS mes, AVG(valor_total) AS media_valor, COUNT(*) AS quantidade
    FROM vendas
    GROUP BY mes
    ORDER BY mes
  `).all();
}


function cidadeComMaisVendas() {
  return db.prepare(`
    SELECT e.cidade, COUNT(v.id) AS quantidade_vendas, SUM(v.valor_total) AS total_vendido
    FROM vendas v
    JOIN clientes c ON c.id = v.cliente_id
    JOIN enderecos e ON e.id = c.endereco_id
    GROUP BY e.cidade
    ORDER BY quantidade_vendas DESC
    LIMIT 1
  `).get();
}

module.exports = {
  criarEndereco,
  atualizarEndereco,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  buscarClientePorId,
  listarClientes,
  listarClientesComVendas,
  criarProduto,
  atualizarProduto,
  deletarProduto,
  listarProdutos,
  buscarProdutoPorId,
  criarVenda,
  deletarVenda,
  listarVendasPorCliente,
  clientesPorCidade,
  totalVendasPorCliente,
  mediaVendasPorMes,
  cidadeComMaisVendas,
};
