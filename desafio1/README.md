# Cadastro de Clientes, Produtos e Vendas

Aplicação web para cadastro de clientes (com busca automática de endereço via CEP), produtos e vendas, com regras de desconto, tabela com filtros/ordenação/paginação e edição/exclusão de registros.

## Stack
- **Backend:** Node.js + Express + [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (banco persistente em `vt.sqlite`).
- **Frontend:** HTML/CSS/JavaScript puro (sem frameworks).
- **Upload de fotos:** Multer (arquivos salvos em `uploads/`).
- **API de CEP:** [BrasilAPI](https://brasilapi.com.br/api/cep/v2/) consumida diretamente pelo frontend.

## Como rodar
```bash
npm install
npm start          # produção: node main.js
# ou
npm run dev         # desenvolvimento com nodemon (reinicia automaticamente)
```
A aplicação fica disponível em `http://localhost:3000`.

## Estrutura
```
main.js              # servidor Express (rotas + arquivos estáticos)
db.js                 # conexão SQLite + criação do schema
querysql.js            # todas as queries SQL (CRUD + consultas analíticas)
routes/                # rotas da API (clientes, produtos, vendas, relatórios)
public/                # frontend (HTML, CSS, JS)
uploads/                # fotos de perfil enviadas
```

## Regras de negócio implementadas
- Um cliente pode ter várias vendas associadas.
- Desconto por cidade do endereço do cliente: **Curitiba 10%**, **São Paulo 5%**.
- Desconto adicional de **15%** para compras com valor bruto acima de R$ 1.000,00.
- Os dois descontos são **cumulativos** (somados) quando ambos se aplicam — decisão de design adotada por não haver especificação explícita sobre o comportamento de descontos simultâneos.

## Consultas SQL disponíveis
Implementadas em `querysql.js` e expostas em `GET /api/relatorios/*`:
- `/api/relatorios/clientes` — lista todos os clientes
- `/api/relatorios/clientes-por-cidade` — quantidade de clientes por cidade
- `/api/relatorios/total-vendas-por-cliente` — total de vendas por cliente
- `/api/relatorios/media-vendas-mes` — média de vendas por mês
- `/api/relatorios/cidade-mais-vendas` — cidade com mais vendas

## Funcionalidades de UI
- Busca de CEP com Enter ou botão "Buscar CEP", preenchendo Rua/Bairro/Cidade/Estado.
- Validação de e-mail e telefone no formulário de cliente (frontend e backend).
- Upload de foto de perfil por cliente.
- Tabela de clientes com paginação, ordenação por coluna (clique no cabeçalho) e filtros por Ano/Mês de cadastro.
- Clique em uma linha da tabela carrega os dados no formulário, habilitando edição e exclusão.
