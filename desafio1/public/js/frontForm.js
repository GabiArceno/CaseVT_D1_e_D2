const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFONE_RE = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/;

let clienteEditId = null;
let enderecoResolvido = null;

const $ = (id) => document.getElementById(id);

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------- Busca de CEP (BrasilAPI) ----------
async function buscarCep() {
  const cepInput = $('cliente-cep');
  const cep = cepInput.value.replace(/\D/g, '');
  $('cliente-erro').textContent = '';

  if (cep.length !== 8) {
    $('cliente-erro').textContent = 'CEP deve conter 8 dígitos';
    return;
  }

  try {
    const resp = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (!resp.ok) {
      throw new Error(resp.status === 404 ? 'CEP não encontrado' : 'Falha ao consultar CEP');
    }
    const dados = await resp.json();
    $('cliente-rua').value = dados.street || '';
    $('cliente-bairro').value = dados.neighborhood || '';
    $('cliente-cidade').value = dados.city || '';
    $('cliente-estado').value = dados.state || '';
    enderecoResolvido = dados;
  } catch (err) {
    enderecoResolvido = null;
    ['cliente-rua', 'cliente-bairro', 'cliente-cidade', 'cliente-estado'].forEach((id) => ($(id).value = ''));
    $('cliente-erro').textContent = err.message || 'Erro ao buscar CEP. Tente novamente.';
  }
}

$('btn-buscar-cep').addEventListener('click', buscarCep);
$('cliente-cep').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    buscarCep();
  }
});

// ---------- Validação e submit do formulário de cliente ----------
function validarFormularioCliente() {
  const campos = {
    nome: $('cliente-nome').value.trim(),
    sobrenome: $('cliente-sobrenome').value.trim(),
    data_nascimento: $('cliente-data-nascimento').value,
    telefone: $('cliente-telefone').value.trim(),
    email: $('cliente-email').value.trim(),
    cep: $('cliente-cep').value.trim(),
  };

  for (const [campo, valor] of Object.entries(campos)) {
    if (!valor) return `Campo obrigatório: ${campo}`;
  }
  if (!EMAIL_RE.test(campos.email)) return 'E-mail em formato inválido';
  if (!TELEFONE_RE.test(campos.telefone)) return 'Telefone em formato inválido. Use (DD) 99999-9999';
  if (!$('cliente-cidade').value) return 'Busque o CEP antes de salvar (clique em "Buscar CEP")';
  return null;
}

$('form-cliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erroEl = $('cliente-erro');
  erroEl.textContent = '';

  const erro = validarFormularioCliente();
  if (erro) {
    erroEl.textContent = erro;
    return;
  }

  const formData = new FormData();
  formData.append('nome', $('cliente-nome').value.trim());
  formData.append('sobrenome', $('cliente-sobrenome').value.trim());
  formData.append('data_nascimento', $('cliente-data-nascimento').value);
  formData.append('telefone', $('cliente-telefone').value.trim());
  formData.append('email', $('cliente-email').value.trim());
  formData.append('cep', $('cliente-cep').value.trim());
  formData.append('rua', $('cliente-rua').value);
  formData.append('bairro', $('cliente-bairro').value);
  formData.append('cidade', $('cliente-cidade').value);
  formData.append('estado', $('cliente-estado').value);
  const foto = $('cliente-foto').files[0];
  if (foto) formData.append('foto', foto);

  try {
    const url = clienteEditId ? `/api/clientes/${clienteEditId}` : '/api/clientes';
    const metodo = clienteEditId ? 'PUT' : 'POST';
    const resp = await fetch(url, { method: metodo, body: formData });
    const dados = await resp.json();
    if (!resp.ok) throw new Error(dados.erro || 'Erro ao salvar cliente');

    resetarFormularioCliente();
    if (typeof renderizarTabelaClientes === 'function') renderizarTabelaClientes();
    await popularSelectsVenda();
  } catch (err) {
    erroEl.textContent = err.message;
  }
});

function resetarFormularioCliente() {
  clienteEditId = null;
  enderecoResolvido = null;
  $('form-cliente').reset();
  ['cliente-rua', 'cliente-bairro', 'cliente-cidade', 'cliente-estado'].forEach((id) => ($(id).value = ''));
  $('btn-salvar-cliente').textContent = 'Criar Cadastro';
  $('btn-excluir-cliente').disabled = true;
  $('btn-cancelar-cliente').disabled = true;
  $('cliente-erro').textContent = '';
}

$('btn-cancelar-cliente').addEventListener('click', resetarFormularioCliente);

$('btn-excluir-cliente').addEventListener('click', async () => {
  if (!clienteEditId) return;
  if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
  try {
    const resp = await fetch(`/api/clientes/${clienteEditId}`, { method: 'DELETE' });
    if (!resp.ok && resp.status !== 204) {
      const dados = await resp.json();
      throw new Error(dados.erro || 'Erro ao excluir cliente');
    }
    resetarFormularioCliente();
    if (typeof renderizarTabelaClientes === 'function') renderizarTabelaClientes();
    await popularSelectsVenda();
  } catch (err) {
    $('cliente-erro').textContent = err.message;
  }
});

// Chamado pelo table.js quando o usuário clica em uma linha
function carregarClienteForm(cliente) {
  clienteEditId = cliente.id;
  $('cliente-id').value = cliente.id;
  $('cliente-nome').value = cliente.nome;
  $('cliente-sobrenome').value = cliente.sobrenome;
  $('cliente-data-nascimento').value = cliente.data_nascimento;
  $('cliente-telefone').value = cliente.telefone;
  $('cliente-email').value = cliente.email;
  $('cliente-cep').value = cliente.cep;
  $('cliente-rua').value = cliente.rua;
  $('cliente-bairro').value = cliente.bairro;
  $('cliente-cidade').value = cliente.cidade;
  $('cliente-estado').value = cliente.estado;

  $('btn-salvar-cliente').textContent = 'Salvar Alterações';
  $('btn-excluir-cliente').disabled = false;
  $('btn-cancelar-cliente').disabled = false;
  $('cliente-erro').textContent = '';
  mostrarView('cliente');
}

// ---------- Produto ----------
function preencherDataCadastroProduto() {
  $('produto-data-cadastro').value = new Date().toLocaleDateString('pt-BR');
}
preencherDataCadastroProduto();

$('form-produto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erroEl = $('produto-erro');
  erroEl.textContent = '';

  const corpo = {
    codigo: $('produto-codigo').value.trim(),
    nome: $('produto-nome').value.trim(),
    descricao: $('produto-descricao').value.trim(),
    valor: $('produto-valor').value,
  };

  if (!corpo.codigo || !corpo.nome || !corpo.valor) {
    erroEl.textContent = 'Preencha código, nome e valor';
    return;
  }
  if (Number(corpo.valor) <= 0) {
    erroEl.textContent = 'O valor deve ser maior que zero';
    return;
  }

  try {
    const resp = await fetch('/api/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    const dados = await resp.json();
    if (!resp.ok) throw new Error(dados.erro || 'Erro ao cadastrar produto');
    $('form-produto').reset();
    preencherDataCadastroProduto();
    await popularSelectsVenda();
  } catch (err) {
    erroEl.textContent = err.message;
  }
});

// ---------- Venda ----------
let produtosCache = [];

async function popularSelectsVenda() {
  const [clientesResp, produtosResp] = await Promise.all([
    fetch('/api/clientes'),
    fetch('/api/produtos'),
  ]);
  const clientes = await clientesResp.json();
  const produtos = await produtosResp.json();
  produtosCache = produtos;

  const selectCliente = $('venda-cliente');
  selectCliente.innerHTML = clientes
    .map((c) => `<option value="${c.id}">${c.nome} ${c.sobrenome}</option>`)
    .join('');

  const selectProduto = $('venda-produto');
  selectProduto.innerHTML = produtos
    .map((p) => `<option value="${p.id}">${p.nome} (${formatarMoeda(p.valor)})</option>`)
    .join('');

  atualizarPreviewVenda();
}

function atualizarPreviewVenda() {
  const produto = produtosCache.find((p) => String(p.id) === $('venda-produto').value);
  const quantidade = Number($('venda-quantidade').value) || 0;
  if (!produto || quantidade <= 0) {
    $('venda-total').value = '';
    return;
  }
  $('venda-total').value = `${formatarMoeda(produto.valor * quantidade)} (sem desconto)`;
}

$('venda-produto').addEventListener('change', atualizarPreviewVenda);
$('venda-quantidade').addEventListener('input', atualizarPreviewVenda);

$('form-venda').addEventListener('submit', async (e) => {
  e.preventDefault();
  const erroEl = $('venda-erro');
  const sucessoEl = $('venda-sucesso');
  erroEl.textContent = '';
  sucessoEl.textContent = '';

  const corpo = {
    cliente_id: $('venda-cliente').value,
    produto_id: $('venda-produto').value,
    quantidade: $('venda-quantidade').value,
  };

  if (!corpo.cliente_id || !corpo.produto_id || !corpo.quantidade) {
    erroEl.textContent = 'Selecione cliente, produto e quantidade';
    return;
  }

  try {
    const resp = await fetch('/api/vendas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    const dados = await resp.json();
    if (!resp.ok) throw new Error(dados.erro || 'Erro ao gerar venda');

    $('venda-total').value = formatarMoeda(dados.valor_total);
    sucessoEl.textContent = `Venda #${dados.id} gerada com sucesso! Total com desconto: ${formatarMoeda(dados.valor_total)}`;
    if (typeof renderizarTabelaClientes === 'function') renderizarTabelaClientes();
  } catch (err) {
    erroEl.textContent = err.message;
  }
});

popularSelectsVenda();
