import re

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait

TIMEOUT_SEGUNDOS = 20
PADRAO_NUMERO_PEDIDO = re.compile(r'Venda #(\d+)')


class AutomacaoFormulario:
    def __init__(self, base_url, headless=True, navegador='chrome'):
        self.base_url = base_url
        self.driver = _criar_driver(navegador, headless)
        self.wait = WebDriverWait(self.driver, TIMEOUT_SEGUNDOS)

    def abrir(self):
        self.driver.get(self.base_url)

    def fechar(self):
        self.driver.quit()

    def cadastrar_cliente(self, dados):
        self._ir_para_aba('cliente')
        self.driver.find_element(By.ID, 'cliente-nome').send_keys(dados['nome'])
        self.driver.find_element(By.ID, 'cliente-sobrenome').send_keys(dados['sobrenome'])
        # input type="date" só aceita o valor confiável via JS (send_keys depende do locale do navegador)
        self.driver.execute_script(
            "document.getElementById('cliente-data-nascimento').value = arguments[0];",
            dados['data_nascimento'],
        )
        self.driver.find_element(By.ID, 'cliente-telefone').send_keys(dados['telefone'])
        self.driver.find_element(By.ID, 'cliente-email').send_keys(dados['email'])

        self.driver.find_element(By.ID, 'cliente-cep').send_keys(str(dados['cep']))
        self.driver.find_element(By.ID, 'btn-buscar-cep').click()
        self.wait.until(lambda d: d.find_element(By.ID, 'cliente-cidade').get_attribute('value') != '')

        self.driver.find_element(By.ID, 'btn-salvar-cliente').click()
        self._esperar_form_resetar('cliente-nome', 'cliente-erro')

    def cadastrar_produto(self, dados):
        self._ir_para_aba('produto')
        self.driver.find_element(By.ID, 'produto-codigo').send_keys(dados['codigo_produto'])
        self.driver.find_element(By.ID, 'produto-nome').send_keys(dados['nome_produto'])
        if dados.get('descricao_produto'):
            self.driver.find_element(By.ID, 'produto-descricao').send_keys(dados['descricao_produto'])
        self.driver.find_element(By.ID, 'produto-valor').send_keys(str(dados['valor_produto']))
        self.driver.find_element(By.CSS_SELECTOR, '#form-produto button[type="submit"]').click()
        self._esperar_form_resetar('produto-codigo', 'produto-erro')

    def gerar_venda(self, cliente_id, produto_id, quantidade):
        self._ir_para_aba('venda')
        Select(self.driver.find_element(By.ID, 'venda-cliente')).select_by_value(str(cliente_id))
        Select(self.driver.find_element(By.ID, 'venda-produto')).select_by_value(str(produto_id))
        campo_quantidade = self.driver.find_element(By.ID, 'venda-quantidade')
        campo_quantidade.clear()
        campo_quantidade.send_keys(str(quantidade))
        self.driver.find_element(By.CSS_SELECTOR, '#form-venda button[type="submit"]').click()

        def condicao(d):
            erro = d.find_element(By.ID, 'venda-erro').text.strip()
            if erro:
                return ('erro', erro)
            sucesso = d.find_element(By.ID, 'venda-sucesso').text.strip()
            if sucesso:
                return ('ok', sucesso)
            return False

        tipo, mensagem = self.wait.until(condicao)
        if tipo == 'erro':
            raise RuntimeError(mensagem)
        match = PADRAO_NUMERO_PEDIDO.search(mensagem)
        if not match:
            raise RuntimeError(f'Não foi possível extrair o número do pedido de: "{mensagem}"')
        return match.group(1)

    def _ir_para_aba(self, nome_view):
        self.driver.find_element(By.CSS_SELECTOR, f'.tab-btn[data-view="{nome_view}"]').click()
        self.wait.until(EC.visibility_of_element_located((By.ID, f'view-{nome_view}')))

    def _esperar_form_resetar(self, campo_id, erro_id):
        def condicao(d):
            erro = d.find_element(By.ID, erro_id).text.strip()
            if erro:
                return ('erro', erro)
            if d.find_element(By.ID, campo_id).get_attribute('value') == '':
                return ('ok', None)
            return False

        tipo, mensagem = self.wait.until(condicao)
        if tipo == 'erro':
            raise RuntimeError(mensagem)


def _criar_driver(navegador, headless):
    if navegador == 'chrome':
        opcoes = webdriver.ChromeOptions()
        if headless:
            opcoes.add_argument('--headless=new')
        return webdriver.Chrome(options=opcoes)
    opcoes = webdriver.FirefoxOptions()
    if headless:
        opcoes.add_argument('-headless')
    return webdriver.Firefox(options=opcoes)
