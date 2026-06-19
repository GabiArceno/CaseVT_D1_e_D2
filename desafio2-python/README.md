# Desafio 2 — Automação com Selenium

Script Python que lê pedidos de um arquivo (CSV, TXT ou Excel), preenche os formulários
do Desafio 1 (Cliente, Produto, Venda) via Selenium e grava de volta no próprio arquivo
o número do pedido gerado ou o erro ocorrido.

## Pré-requisitos
- Desafio 1 rodando em `http://localhost:3000` (ver [README do Desafio 1](../desafio1/README.md): `npm start`).
- Python 3.10+.
- Google Chrome instalado (o `chromedriver` é baixado automaticamente pelo Selenium Manager
  na primeira execução — não precisa instalar nada manualmente). Para usar Firefox em vez de
  Chrome, troque `navegador='chrome'` por `navegador='firefox'` em `automacao_selenium.py`.

## Como rodar
```bash
cd desafio2-python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python main.py dados_exemplo.csv
# ou
python main.py dados_exemplo.txt
python main.py dados_exemplo.xlsx
```

## Formato do arquivo de entrada
Colunas: `nome, sobrenome, data_nascimento (AAAA-MM-DD), telefone, email, cep, codigo_produto,
nome_produto, descricao_produto, valor_produto, quantidade`.

Não é preciso informar rua/bairro/cidade/estado — o próprio formulário busca o endereço pelo
CEP (reaproveitando a integração com a BrasilAPI já existente no Desafio 1).

Ao final de cada pedido processado, o script grava nas colunas `numero_pedido` e `status`
(`sucesso` ou `erro: <motivo>`) no mesmo arquivo de entrada.

## Formatos suportados
`arquivo_dados.py` escolhe o leitor/escritor pela extensão do arquivo:
- `.csv` — módulo `csv` padrão.
- `.txt` — `csv` com detecção automática do delimitador (`csv.Sniffer`).
- `.xlsx` — `openpyxl`.

## Idempotência
Linhas que já têm `numero_pedido` preenchido são puladas em execuções futuras. Linhas com
erro ficam com `status = "erro: ..."` e são tentadas novamente na próxima execução.

## Decisões de design
- Antes de usar o Selenium para cadastrar cliente/produto, o script consulta
  `GET /api/clientes` e `GET /api/produtos` (endpoints já existentes no Desafio 1) para
  verificar se já existem — evita recriar o mesmo cliente/produto em execuções repetidas
  ou quando duas linhas do arquivo compartilham e-mail/código.
- A seleção de cliente/produto no formulário de venda é feita pelo `value` (id) da `<option>`,
  não pelo texto visível, para ser robusta independente de formatação.
- O número do pedido é extraído da mensagem de sucesso exibida na tela
  (`Venda #<id> gerada com sucesso!...`), conforme exigido pelo desafio.
