const TAMANHO_PAGINA = 5;

let clientesCache = [];
let vendasCache = [];
let paginaAtual = 1;
let ordenacao = { campo: 'criado_em', direcao: 'desc' };
let clienteExpandidoId = null;

async function renderizarTabelaClientes() {
  const [respClientes, respVendas] = await Promise.all([fetch('/api/clientes'), fetch('/api/vendas')]);
  clientesCache = await respClientes.json();
  vendasCache = await respVendas.json();
  popularFiltroAno();
  paginaAtual = 1;
  desenharTabela();
}

function popularFiltroAno() {
  const anos = [...new Set(clientesCache.map((c) => c.criado_em.slice(0, 4)))].sort().reverse();
  const select = document.getElementById('filtro-ano');
  const valorAtual = select.value;
  select.innerHTML = '<option value="">Todos</option>' + anos.map((a) => `<option value="${a}">${a}</option>`).join('');
  select.value = anos.includes(valorAtual) ? valorAtual : '';
}

function obterDadosFiltradosEOrdenados() {
  const ano = document.getElementById('filtro-ano').value;
  const mes = document.getElementById('filtro-mes').value;

  let dados = clientesCache.filter((c) => {
    const [anoCadastro, mesCadastro] = c.criado_em.split('-');
    if (ano && anoCadastro !== ano) return false;
    if (mes && mesCadastro !== mes) return false;
    return true;
  });

  const { campo, direcao } = ordenacao;
  dados.sort((a, b) => {
    let va = a[campo];
    let vb = b[campo];
    if (campo === 'nome') {
      va = `${a.nome} ${a.sobrenome}`;
      vb = `${b.nome} ${b.sobrenome}`;
    }
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return direcao === 'asc' ? -1 : 1;
    if (va > vb) return direcao === 'asc' ? 1 : -1;
    return 0;
  });

  return dados;
}

function desenharTabela() {
  const dados = obterDadosFiltradosEOrdenados();
  const totalPaginas = Math.max(1, Math.ceil(dados.length / TAMANHO_PAGINA));
  paginaAtual = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaAtual - 1) * TAMANHO_PAGINA;
  const pagina = dados.slice(inicio, inicio + TAMANHO_PAGINA);

  const corpo = document.getElementById('tabela-clientes-body');
  corpo.innerHTML = pagina
    .map(
      (c) => `
    <tr data-id="${c.id}">
      <td class="foto-cell">${c.foto_path ? `<img src="${c.foto_path}" alt="foto">` : ''}</td>
      <td>${c.nome} ${c.sobrenome}</td>
      <td>${c.email}</td>
      <td>${c.cidade}</td>
      <td>${c.criado_em}</td>
      <td><button type="button" class="btn-compras" data-id="${c.id}">${c.total_compras} compra(s)</button></td>
      <td>${formatarMoeda(c.total_gasto)}</td>
    </tr>
    ${clienteExpandidoId === c.id ? linhaDetalheCompras(c.id) : ''}
  `
    )
    .join('');

  corpo.querySelectorAll('tr[data-id]').forEach((tr) => {
    tr.addEventListener('click', () => {
      const cliente = clientesCache.find((c) => String(c.id) === tr.dataset.id);
      if (cliente) carregarClienteForm(cliente);
      corpo.querySelectorAll('tr[data-id]').forEach((r) => r.classList.remove('selecionada'));
      tr.classList.add('selecionada');
    });
  });

  corpo.querySelectorAll('.btn-compras').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      clienteExpandidoId = clienteExpandidoId === id ? null : id;
      desenharTabela();
    });
  });

  desenharPaginacao(totalPaginas);
}

// Linha expandida exibindo cada compra do cliente (req. 6: "exibindo suas informações e compras")
function linhaDetalheCompras(clienteId) {
  const compras = vendasCache.filter((v) => v.cliente_id === clienteId);
  const itens = compras.length
    ? compras
        .map(
          (v) => `
        <tr>
          <td>${v.produto_nome}</td>
          <td>${v.quantidade}</td>
          <td>${formatarMoeda(v.valor_total)}</td>
          <td>${v.data_compra}</td>
        </tr>`
        )
        .join('')
    : '<tr><td colspan="4">Nenhuma compra registrada</td></tr>';

  return `
    <tr class="linha-detalhe">
      <td colspan="7">
        <table class="tabela-compras">
          <thead><tr><th>Produto</th><th>Qtd.</th><th>Valor</th><th>Data</th></tr></thead>
          <tbody>${itens}</tbody>
        </table>
      </td>
    </tr>
  `;
}

function desenharPaginacao(totalPaginas) {
  const container = document.getElementById('paginacao');
  container.innerHTML = '';
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === paginaAtual) btn.classList.add('ativo');
    btn.addEventListener('click', () => {
      paginaAtual = i;
      desenharTabela();
    });
    container.appendChild(btn);
  }
}

document.querySelectorAll('#tabela-clientes th[data-sort]').forEach((th) => {
  th.addEventListener('click', () => {
    const campo = th.dataset.sort;
    if (ordenacao.campo === campo) {
      ordenacao.direcao = ordenacao.direcao === 'asc' ? 'desc' : 'asc';
    } else {
      ordenacao = { campo, direcao: 'asc' };
    }
    desenharTabela();
  });
});

document.getElementById('filtro-ano').addEventListener('change', () => {
  paginaAtual = 1;
  desenharTabela();
});
document.getElementById('filtro-mes').addEventListener('change', () => {
  paginaAtual = 1;
  desenharTabela();
});

renderizarTabelaClientes();
