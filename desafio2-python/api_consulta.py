import requests


def buscar_cliente_por_email(base_url, email):
    resp = requests.get(f'{base_url}/api/clientes', timeout=10)
    resp.raise_for_status()
    email_norm = email.strip().lower()
    for cliente in resp.json():
        if cliente['email'].strip().lower() == email_norm:
            return cliente
    return None


def buscar_produto_por_codigo(base_url, codigo):
    resp = requests.get(f'{base_url}/api/produtos', timeout=10)
    resp.raise_for_status()
    codigo_norm = codigo.strip().lower()
    for produto in resp.json():
        if produto['codigo'].strip().lower() == codigo_norm:
            return produto
    return None
