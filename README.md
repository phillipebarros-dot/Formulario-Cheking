# Formulário de Checking - OpusMúltipla

![Status do Projeto](https://img.shields.io/badge/status-ativo-brightgreen)
![n8n](https://img.shields.io/badge/n8n-1.110.1%2B-blueviolet)
![Google Sheets](https://img.shields.io/badge/Google-Sheets-green)
![Google Drive](https://img.shields.io/badge/Google-Drive-yellow)

Este repositório contém o código-fonte e a documentação completa do formulário para submissão de checkings da OpusMúltipla. O projeto integra uma interface de usuário simples com um robusto workflow de automação em n8n para otimizar e garantir a confiabilidade de todo o processo.

## 🚀 O Projeto

O objetivo principal deste projeto é automatizar o processo de "Checking" de Propostas de Inserção (PIs), resolvendo os gargalos do fluxo de trabalho manual. A solução substitui a troca de e-mails e a validação manual por um sistema centralizado que garante a integridade dos dados, organiza os arquivos de forma automática e notifica as equipes em tempo real, aumentando a eficiência, a rastreabilidade e a confiabilidade da operação.

## ✨ Principais Funcionalidades

* **Auto-preenchimento Inteligente:** Ao digitar o número da PI, o formulário consulta a planilha de referência em tempo real e preenche automaticamente os campos de Cliente, Campanha, Produto, Período, Veículo e Meio, reduzindo a digitação e prevenindo erros.
* **Validação de Dados na Origem:** O sistema valida múltiplas regras de negócio antes de aceitar o envio:
    * Verifica se a PI existe no banco de dados.
    * Confere se o status da PI é "ativa".
    * Valida a quantidade mínima de arquivos necessários com base no tipo de veículo selecionado.
* **Organização Automática e Centralizada:** Os comprovantes enviados são salvos automaticamente em uma pasta específica no Google Drive, nomeada dinamicamente com o número da PI (ex: `PI_103061`), eliminando a necessidade de organização manual.
* **Notificações Imediatas:** Uma notificação por e-mail é disparada para as equipes responsáveis assim que um checking é validado e processado, garantindo que todos estejam cientes e que os próximos passos possam ser tomados sem demora.
* **Registro de Log e Auditoria:** Cada envio bem-sucedido é registrado com data e hora em uma aba específica da planilha, criando um histórico completo e facilmente auditável de todas as operações.

## 🛠️ Tecnologias Utilizadas

* 🎨 **Front-end:** HTML5, CSS3, JavaScript (Vanilla)
* ⚙️ **Orquestração e Automação:** n8n (Self-Hosted v1.110.1+)
* 💾 **Fonte de Dados e Armazenamento:** Google Sheets e Google Drive
* ☁️ **Hospedagem do Formulário:** GitHub Pages

## 🌐 Como Usar

1.  Acesse o formulário hospedado online:
    **[https://phillipebarros-dot.github.io/Formulario-Cheking/](https://phillipebarros-dot.github.io/Formulario-Cheking/)**
2.  Digite o número da PI no campo correspondente e aguarde o preenchimento automático dos dados.
3.  Preencha os campos restantes (Nome, E-mail, Telefone) e anexe os arquivos de comprovação.
4.  Clique em "Enviar". O sistema cuidará de todo o resto e exibirá uma mensagem de sucesso ou erro.

## 🤖 Como Funciona a Automação (n8n)

O formulário se comunica com um workflow no n8n que executa a seguinte sequência lógica:

`Formulário envia dados para a URL do n8n`
➔ **1. Webhook (Recebe):** Captura a requisição do formulário.
➔ **2. Identificar Ação (Function):** Analisa os dados e cria a variável "tipo" (`buscar_pi` ou `submissao`).
➔ **3. IF Ação (Roteamento):** Direciona o fluxo com base no "tipo".

| Rota de Busca (`buscar_pi`)                               | Rota de Envio (`submissao`)                                     |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| ➔ **4a. Buscar PI (Google Sheets):** Procura a PI na base. | ➔ **4b. Buscar PI (Google Sheets):** Valida se a PI existe.      |
| ➔ **5a. Montar Resposta (Function):** Formata os dados.     | ➔ **5b. Verificar PI Existe (IF):** Para se a PI não for encontrada. |
| ➔ **6a. Responder p/ Webhook:** Envia os dados de volta.   | ➔ **6b. Validar Status (Function):** Para se a PI não estiver "ativa". |
|                                                           | ➔ **7b. Validar Anexos (IFs + Function):** Confere qtd. de arquivos. |
|                                                           | ➔ **8b. Criar Pasta (Google Drive):** Cria uma pasta para a PI.    |
|                                                           | ➔ **9b. Upload Arquivos (Google Drive):** Salva os comprovantes.  |
|                                                           | ➔ **10b. Registrar Log (Google Sheets):** Adiciona linha de auditoria. |
|                                                           | ➔ **11b. Enviar Notificação (Email):** Envia e-mail de confirmação.  |
|                                                           | ➔ **12b. Responder Sucesso:** Envia mensagem final ao formulário.   |

## 👨‍💻 Para Desenvolvedores

### Comunicação Front-end <> n8n

O arquivo `index.html` se comunica com o n8n através de duas ações distintas para o mesmo endpoint do Webhook:

1.  **Busca de PI:** Uma requisição `POST` com `Content-Type: application/json` e o corpo: `{ "action": "buscar_pi", "n_pi": "..." }`.
2.  **Submissão de Formulário:** Uma requisição `POST` com `Content-Type: multipart/form-data`, contendo todos os campos do formulário e os arquivos.

### Configuração Essencial do n8n (CORS)

Como o formulário está em um domínio (`phillipebarros-dot.github.io`) e a automação em outro (`n8n.grupoom.com.br`), é **obrigatório** configurar o CORS no servidor n8n para permitir a comunicação. Adicione as seguintes variáveis de ambiente à sua configuração do n8n (ex: `docker-compose.yml` ou `.env`):

```bash
# Permite que o seu formulário no GitHub Pages faça requisições.
N8N_CORS_ALLOWED_ORIGINS=[https://phillipebarros-dot.github.io](https://phillipebarros-dot.github.io)

# Permite os métodos HTTP necessários para a busca (POST) e verificação (OPTIONS).
N8N_CORS_ALLOWED_METHODS=GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS

# Permite os cabeçalhos que o navegador envia durante a comunicação.
N8N_CORS_ALLOWED_HEADERS=Origin,X-Requested-With,Content-Type,Accept,Authorization,X-N8N-API-KEY
Importante: Lembre-se de reiniciar sua instância do n8n após adicionar ou alterar essas variáveis para que as mudanças tenham efeito.

Domínio Personalizado
Para usar um domínio da empresa (ex: checking.grupoom.com.br), são necessários dois passos:

DNS: Criar um registro CNAME no provedor de domínio apontando o subdomínio desejado para phillipebarros-dot.github.io..

GitHub: Adicionar o domínio personalizado nas configurações do repositório no GitHub Pages (Settings > Pages > Custom domain).

Se você configurar um domínio personalizado, lembre-se de atualizar a variável N8N_CORS_ALLOWED_ORIGINS com o novo endereço (ex: https://checking.grupoom.com.br).

🔗 Links Úteis
Planilha de Referência: Google Sheets (Acesso restrito)

Painel do n8n: https://n8n.grupoom.com.br

Repositório do Projeto: GitHub
