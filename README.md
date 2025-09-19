# Formulário de Checking - OpusMúltipla

![Status do Projeto](https://img.shields.io/badge/status-ativo-brightgreen)

Este repositório contém o código-fonte e a documentação do formulário para submissão de checkings da OpusMúltipla. O projeto foi desenvolvido para automatizar e otimizar um processo anteriormente manual, integrando uma interface de usuário simples com um poderoso workflow de automação construído em n8n.

## 🚀 O Projeto

O objetivo principal deste projeto é resolver os gargalos do processo de checking de PIs, que envolvia a troca de e-mails, validação manual de dados e armazenamento descentralizado de arquivos. A solução centraliza o recebimento de comprovantes em um único formulário inteligente, que valida as informações em tempo real e organiza os dados de forma automática, garantindo agilidade, consistência e rastreabilidade.

## ✨ Principais Funcionalidades

* **Auto-preenchimento de Dados:** Ao digitar o número da PI, o formulário consulta uma planilha central e preenche automaticamente os campos de Cliente, Campanha, Produto e Período.
* **Validação em Tempo Real:** O sistema verifica se a PI existe e se está com o status "ativa" antes de permitir o envio.
* **Validação de Anexos:** O workflow valida a quantidade mínima de arquivos necessários com base no tipo de veículo selecionado (ex: DOOH exige mais anexos que Mídia Externa).
* **Organização Automática de Arquivos:** Os comprovantes são salvos automaticamente em uma pasta no Google Drive, nomeada dinamicamente com o número da PI.
* **Notificações Imediatas:** Uma notificação por e-mail é enviada para as equipes responsáveis assim que um checking é validado e processado com sucesso.
* **Registro de Log:** Cada envio bem-sucedido é registrado em uma planilha, criando um histórico auditável de todas as operações.

## 🛠️ Tecnologias Utilizadas

* 🎨 **Front-end:** HTML5, CSS3, JavaScript (Vanilla)
* ⚙️ **Orquestração e Automação:** n8n (Self-Hosted)
* 💾 **Fonte de Dados e Armazenamento:** Google Sheets e Google Drive

## 🌐 Como Usar

1.  Acesse o formulário hospedado online:
    **[https://phillipebarros-dot.github.io/Formulario-Cheking/](https://phillipebarros-dot.github.io/Formulario-Cheking/)**

2.  Digite o número da PI para que os dados sejam carregados automaticamente.

3.  Preencha os campos restantes e anexe os arquivos de comprovação.

4.  Clique em "Enviar". O sistema cuidará de todo o resto.

## 🤖 Como Funciona a Automação (n8n)

O formulário se comunica com um workflow no n8n que executa a seguinte lógica:
