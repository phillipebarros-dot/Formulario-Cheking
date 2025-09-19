```markdown
# Formulário de Checking - OpusMúltipla

![Status do Projeto](https://img.shields.io/badge/status-ativo-brightgreen)
![n8n](https://img.shields.io/badge/n8n-1.110.1-blueviolet)
![Google Sheets](https://img.shields.io/badge/Google-Sheets-green)
![Google Drive](https://img.shields.io/badge/Google-Drive-yellow)

Este repositório contém o código-fonte e a documentação completa do formulário para submissão de checkings da OpusMúltipla. O projeto integra uma interface de usuário simples com um robusto workflow de automação em n8n para otimizar e garantir a confiabilidade de todo o processo.

## 🚀 O Projeto

O objetivo principal deste projeto é automatizar o processo de "Checking" de Propostas de Inserção (PIs), resolvendo os gargalos do fluxo de trabalho manual. A solução substitui a troca de e-mails e a validação manual por um sistema centralizado que garante a integridade dos dados, organiza os arquivos de forma automática e notifica as equipes em tempo real, aumentando a eficiência, a rastreabilidade e a confiabilidade da operação.

## ✨ Principais Funcionalidades

* **Auto-preenchimento Inteligente:** Ao digitar o número da PI, o formulário consulta a planilha de referência em tempo real e preenche automaticamente os campos de Cliente, Campanha, Produto e Período, reduzindo a digitação e prevenindo erros.
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

3.  Preencha os campos restantes (Nome, E-mail, etc.) e anexe os arquivos de comprovação.

4.  Clique em "Enviar". O sistema cuidará de todo o resto e exibirá uma mensagem de sucesso ou erro.

## 🤖 Como Funciona a Automação (n8n)

O formulário se comunica com um workflow no n8n que executa uma sequência lógica detalhada para cada requisição.

```

Formulário envia dados para a URL do n8n
➔ 1. Webhook (Recebe): Captura a requisição do formulário.
➔ 2. Identificar Ação (Function): Analisa os dados e cria a variável "tipo" (busca ou submissão).
➔ 3. IF Ação (Roteamento): Direciona o fluxo com base no "tipo".
|
├─\> Rota de Busca (se tipo == 'buscar\_pi'):
|     ➔ 4a. Buscar PI (dados) (Google Sheets): Procura o N\_PI na aba "base".
|     ➔ 5a. Montar Resposta PI (Function): Formata os dados encontrados ou uma mensagem de erro.
|     ➔ 6a. Responder Dados PI (Respond to Webhook): Envia a resposta de volta para o formulário.
|
└─\> Rota de Envio (se tipo == 'submissao'):
➔ 4b. Buscar PI (submissao) (Google Sheets): Valida se a PI existe e mescla os dados.
➔ 5b. Verificar PI Existe (IF): Interrompe o fluxo se a PI não for encontrada.
➔ 6b. Validar Status PI (Function): Interrompe o fluxo se a PI não estiver "ativa".
➔ 7b. Cadeia de IFs (Veículo DO/ME): Verifica o tipo de veículo para validações extras de anexos.
➔ 8b. Validar Anexos (Function): Confere se o número mínimo de arquivos foi enviado.
➔ 9b. Criar Pasta PI (Google Drive): Cria uma pasta única e nomeada para a PI.
➔ 10b. Upload Arquivos (Google Drive): Salva os comprovantes na pasta criada.
➔ 11b. Registrar Log (Google Sheets): Adiciona uma linha de auditoria na aba "Log\_Checkings".
➔ 12b. Enviar Notificação (Email): Envia o e-mail de confirmação para a equipe.
➔ 13b. Responder Sucesso (Respond to Webhook): Envia a mensagem final de sucesso para o formulário.

````

## 👨‍💻 Para Desenvolvedores

### Comunicação Front-end <> n8n
O arquivo `index.html` se comunica com o n8n através de duas ações distintas para o mesmo endpoint do Webhook:
1.  **Busca de PI:** Uma requisição `POST` com `Content-Type: application/json` e o corpo: `{ "action": "buscar_pi", "n_pi": "..." }`.
2.  **Submissão de Formulário:** Uma requisição `POST` com `Content-Type: multipart/form-data`, contendo todos os campos do formulário e os arquivos.

### Configuração do n8n (CORS)
Para que o formulário no GitHub Pages possa se comunicar com a instância do n8n, a configuração de CORS no servidor n8n é obrigatória. As seguintes variáveis de ambiente devem ser definidas:

```bash
N8N_CORS_ALLOW_ORIGIN=[https://phillipebarros-dot.github.io](https://phillipebarros-dot.github.io)
N8N_CORS_ALLOW_HEADERS=Content-Type,Authorization
````

### Domínio Personalizado

Para usar um domínio da empresa (ex: `checking.grupoom.com.br`), são necessários dois passos:

1.  **DNS:** Criar um registro `CNAME` no provedor de domínio apontando o subdomínio para `phillipebarros-dot.github.io.`.
2.  **GitHub:** Adicionar o domínio personalizado nas configurações do GitHub Pages (`Settings > Pages > Custom domain`).

## 🔗 Links Úteis

  * **Planilha de Referência das PIs:** [Google Sheets](https://docs.google.com/spreadsheets/d/1iwUay2RE8k1PumivMbEjuzIyw4CBaktJ2YPsR1iwe_Q/edit?usp=sharing)
  * **Painel do n8n:** [https://n8n.grupoom.com.br](https://n8n.grupoom.com.br)
  * **Repositório do Projeto:** [GitHub](https://www.google.com/search?q=https://github.com/phillipebarros-dot/Formulario-Cheking)

<!-- end list -->

```
```
