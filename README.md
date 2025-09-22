# Formulário de Checking - OpusMúltipla

![Status do Projeto](https://img.shields.io/badge/status-ativo-brightgreen)
![n8n](https://img.shields.io/badge/n8n-1.110.1%2B-blueviolet)
![Google Sheets](https://img.shields.io/badge/Google-Sheets-green)
![Google Drive](https://img.shields.io/badge/Google-Drive-yellow)

Este repositório contém o código-fonte e a documentação completa do formulário para submissão de checkings da OpusMúltipla. O projeto integra uma interface de usuário inteligente com um robusto workflow de automação em n8n para otimizar e garantir a confiabilidade de todo o processo.

## 🚀 O Projeto

O objetivo principal deste projeto é automatizar o processo de "Checking" de Propostas de Inserção (PIs), resolvendo os gargalos do fluxo de trabalho manual. A solução substitui a troca de e-mails e a validação manual por um sistema centralizado que garante a integridade dos dados, organiza os arquivos de forma automática e notifica as equipes em tempo real, aumentando a eficiência, a rastreabilidade e a confiabilidade da operação.

## ✨ Principais Funcionalidades

* **Auto-preenchimento Inteligente:** Ao digitar o número da PI, o formulário consulta a planilha de referência em tempo real e preenche automaticamente os campos de `Cliente`, `Campanha`, `Produto`, `Período`, `Veículo` e `Meio`, reduzindo a digitação e prevenindo erros.
* **Validação Híbrida (Front-end e Back-end):** O sistema valida múltiplas regras de negócio em diferentes etapas para garantir a máxima integridade dos dados:
    * **Feedback Imediato ao Usuário:** O formulário valida o preenchimento de campos obrigatórios e a anexação de arquivos **antes** do envio, fornecendo feedback instantâneo e evitando requisições desnecessárias.
    * **Validação no Back-end:** O n8n revalida se a PI existe, se seu status é "ativa" e se a quantidade mínima de arquivos foi enviada.
* **Organização Automática e Centralizada:** Os comprovantes são salvos automaticamente em uma pasta específica no Google Drive, nomeada dinamicamente com o número da PI (ex: `PI_182429`), eliminando a organização manual.
* **Notificações Imediatas:** Uma notificação por e-mail é disparada para as equipes responsáveis assim que um checking é validado, garantindo que todos estejam cientes.
* **Registro de Log e Auditoria:** Cada envio bem-sucedido é registrado com data e hora em uma aba específica da planilha, criando um histórico completo e facilmente auditável.

## 🛠️ Tecnologias Utilizadas

* 🎨 **Front-end:** HTML5, CSS3, JavaScript (Vanilla)
* ⚙️ **Orquestração e Automação:** n8n (Self-Hosted)
* 💾 **Fonte de Dados e Armazenamento:** Google Sheets e Google Drive
* ☁️ **Hospedagem do Formulário:** GitHub Pages

## 🌐 Como Usar

1.  Acesse o formulário hospedado online:
    **[https://phillipebarros-dot.github.io/Formulario-Cheking/](https://phillipebarros-dot.github.io/Formulario-Cheking/)**
2.  Digite o número da PI e aguarde o preenchimento automático.
3.  Preencha seus dados de contato e anexe os arquivos de comprovação.
4.  Clique em "Enviar". O sistema cuidará do resto e exibirá uma mensagem de status.

## 🤖 Como Funciona a Automação (n8n)

O formulário se comunica com um workflow no n8n que executa uma sequência lógica detalhada para cada requisição. A automação é dividida em duas rotas principais: uma para a busca rápida de dados da PI e outra para o processamento completo da submissão.

Para uma análise técnica detalhada de cada nó do workflow, **[consulte a documentação completa aqui](./WORKFLOW.md)**.

## 👨‍💻 Para Desenvolvedores

### Comunicação Front-end <> n8n
O `index.html` se comunica com o n8n através de duas ações distintas para o mesmo endpoint do Webhook:
1.  **Busca de PI:** Uma requisição `POST` com `Content-Type: application/json` e o corpo: `{ "action": "buscar_pi", "n_pi": "..." }`.
2.  **Submissão de Formulário:** Uma requisição `POST` com `Content-Type: multipart/form-data`, contendo todos os campos e arquivos.

### Configuração Essencial do n8n (CORS)
Como o formulário está em um domínio diferente da automação, é **obrigatório** configurar o CORS no servidor n8n. Adicione as seguintes variáveis de ambiente à sua instância:

```bash
# Permite que o seu formulário no GitHub Pages faça requisições.
N8N_CORS_ALLOWED_ORIGINS=[https://phillipebarros-dot.github.io](https://phillipebarros-dot.github.io)

# Permite os métodos HTTP necessários para a busca (POST) e verificação (OPTIONS).
N8N_CORS_ALLOWED_METHODS=GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS

# Permite os cabeçalhos que o navegador envia durante a comunicação.
N8N_CORS_ALLOWED_HEADERS=Origin,X-Requested-With,Content-Type,Accept,Authorization,X-N8N-API-KEY
