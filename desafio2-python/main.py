import sys

from api_consulta import buscar_cliente_por_email, buscar_produto_por_codigo
from arquivo_dados import atualizar_pedido, ler_pedidos
from automacao_selenium import AutomacaoFormulario

BASE_URL = 'http://localhost:3000'


def processar_pedido(automacao, pedido):
    cliente = buscar_cliente_por_email(BASE_URL, pedido['email'])
    if cliente is None:
        automacao.cadastrar_cliente(pedido)
        cliente = buscar_cliente_por_email(BASE_URL, pedido['email'])
        if cliente is None:
            raise RuntimeError('Cliente não encontrado mesmo após o cadastro')

    produto = buscar_produto_por_codigo(BASE_URL, pedido['codigo_produto'])
    if produto is None:
        automacao.cadastrar_produto(pedido)
        produto = buscar_produto_por_codigo(BASE_URL, pedido['codigo_produto'])
        if produto is None:
            raise RuntimeError('Produto não encontrado mesmo após o cadastro')

    return automacao.gerar_venda(cliente['id'], produto['id'], pedido['quantidade'])


def main():
    if len(sys.argv) < 2:
        print('Uso: python main.py <arquivo.csv|.txt|.xlsx>')
        sys.exit(1)

    caminho = sys.argv[1]
    pedidos = ler_pedidos(caminho)

    automacao = AutomacaoFormulario(BASE_URL, headless=True)
    automacao.abrir()
    try:
        for indice, pedido in enumerate(pedidos):
            if pedido.get('numero_pedido'):
                print(f'[{indice}] já processado (pedido #{pedido["numero_pedido"]}), pulando')
                continue
            try:
                numero_pedido = processar_pedido(automacao, pedido)
                atualizar_pedido(caminho, indice, numero_pedido, 'sucesso')
                print(f'[{indice}] sucesso — pedido #{numero_pedido}')
            except Exception as erro:
                atualizar_pedido(caminho, indice, '', f'erro: {erro}')
                print(f'[{indice}] erro: {erro}')
    finally:
        automacao.fechar()


if __name__ == '__main__':
    main()
