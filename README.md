# Checking - OpusMúltipla

<!-- Badges de Status (Exemplos) -->
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![n8n](https://img.shields.io/badge/n8n-12B57A?style=for-the-badge&logo=n8n&logoColor=white)

Este repositório contém o código-fonte da aplicação **Checking Central**, uma ferramenta desenvolvida para otimizar e padronizar o processo de recebimento de comprovantes de veiculação de mídia dos fornecedores e parceiros da agência OpusMúltipla.

## 📜 Índice

- [Visão Geral do Projeto](#-visão-geral-do-projeto)
  - [O Problema](#o-problema)
  - [A Solução](#a-solução)
- [✨ Funcionalidades Principais](#-funcionalidades-principais)
- [⚙️ Arquitetura e Tecnologias](#️-arquitetura-e-tecnologias)
- [🔀 Fluxo de Dados](#-fluxo-de-dados)
- [📁 Estrutura de Arquivos](#-estrutura-de-arquivos)
- [🚀 Como Começar (Ambiente Local)](#-como-começar-ambiente-local)
- [🤝 Como Contribuir](#-como-contribuir)

## 🎯 Visão Geral do Projeto

### O Problema

O processo manual de receber, validar e organizar comprovantes de veiculação de mídia de diversos fornecedores é propenso a erros, inconsistências e consome um tempo valioso da equipe. A falta de um ponto centralizado e de um formato padrão dificulta o rastreamento e a conformidade, podendo levar a atrasos em pagamentos e relatórios.

### A Solução

O **Checking Central** é uma aplicação web de ponta a ponta que resolve esse problema. Ela oferece uma interface moderna, intuitiva e segura para que os parceiros possam submeter seus relatórios e arquivos de comprovação. O sistema guia o usuário através de um fluxo inteligente, realizando validações em tempo real e garantindo que todos os dados necessários sejam coletados de forma padronizada, de acordo com as especificidades de cada tipo de mídia.

## ✨ Funcionalidades Principais

- **Formulário Dinâmico e Reativo:** A interface se adapta em tempo real, exibindo campos de upload específicos com base no tipo de mídia (TV, Rádio, Digital, OOH, etc.) associado a uma Proposta de Inserção (PI).
- **Autenticação por CNPJ:** O fluxo se inicia com a identificação do fornecedor via CNPJ, garantindo que apenas PIs relevantes para aquele parceiro sejam exibidas.
- **Busca e Validação de PIs:** Integração direta com um sistema backend (via n8n) para buscar e validar as PIs existentes para um determinado CNPJ.
- **Upload de Arquivos Grandes:** Utiliza `XMLHttpRequest` para gerenciar o upload de arquivos, exibindo o progresso em tempo real e suportando arquivos de até 500MB.
- **Feedback de Sucesso e Erro:** Notificações claras informam ao usuário o status do envio, garantindo uma experiência de usuário positiva.
- **Reset Inteligente do Formulário:** Após um envio bem-sucedido, o formulário é parcialmente resetado, permitindo que o usuário envie comprovantes para outras PIs do mesmo CNPJ sem preencher novamente todos os dados.

## ⚙️ Arquitetura e Tecnologias

A aplicação foi construída com um stack moderno e robusto, focado em performance, escalabilidade e experiência do desenvolvedor.

- **Frontend Framework:** **Next.js (App Router)**
  - Utiliza React Server Components para renderização otimizada no servidor, diminuindo o JavaScript enviado ao cliente e melhorando o tempo de carregamento inicial (FCP/LCP).
- **Linguagem:** **TypeScript**
  - Garante a segurança de tipos em todo o projeto, prevenindo bugs em tempo de desenvolvimento e melhorando a manutenibilidade do código.
- **UI Components:** **ShadCN/UI**
  - Uma coleção de componentes de UI acessíveis e reutilizáveis, construídos sobre Radix UI e Tailwind CSS, que podem ser customizados diretamente no projeto.
- **Estilização:** **Tailwind CSS**
  - Uma abordagem "utility-first" para CSS que permite a criação de designs complexos e responsivos diretamente no HTML/JSX, mantendo a consistência visual.
- **Gerenciamento de Formulário:** **React Hook Form** + **Zod**
  - **React Hook Form:** Gerencia o estado do formulário de maneira performática, controlando inputs, validações e submissões.
  - **Zod:** Define os esquemas de validação tanto no cliente quanto no servidor, garantindo que os dados estejam no formato correto antes de qualquer processamento.
- **Comunicação com Backend:** **Next.js Server Actions**
  - Funções assíncronas que rodam exclusivamente no servidor, mas podem ser chamadas diretamente dos componentes no cliente. Isso simplifica a comunicação com o backend, eliminando a necessidade de criar rotas de API manualmente.
- **Backend (Automação):** **n8n**
  - A aplicação se comunica com um webhook exposto por um fluxo de trabalho no n8n. Este fluxo é o cérebro da lógica de negócio, responsável por:
    - Consultar a base de dados de PIs.
    - Receber os dados e arquivos do formulário.
    - Fazer o upload dos arquivos para o Google Drive.
    - Registrar a submissão em uma planilha do Google Sheets.
    - Enviar e-mails de notificação.

## 🔀 Fluxo de Dados

O fluxo de dados da aplicação segue um caminho claro e seguro, da interface do usuário até o processamento final no backend.

```
┌─────────────────────────┐      ┌──────────────────────────┐      ┌───────────────────────┐
│     CLIENTE (Browser)   │      │   SERVIDOR (Next.js)   │      │      BACKEND (n8n)      │
└─────────────────────────┘      └──────────────────────────┘      └───────────────────────┘
           │                                 │                                 │
1. Input CNPJ no formulário                  │                                 │
           ├─────────────────► 2. Chama Server Action        │
           │                       `fetchPIsByCNPJ(cnpj)`    │
           │                                 ├───────────────► 3. POST para Webhook n8n
           │                                 │                     (action: buscar_pis)
           │                                 │                                 │
           │                                 │               4. n8n busca no BD/Sheets
           │                                 │                                 │
           │                                 ◄───────────────┤ 5. n8n retorna lista de PIs
           │                       6. Server Action retorna   │
           │                       a lista de PIs           │
           ◄─────────────────┤                                 │
7. UI exibe as PIs e o usuário │                                 │
   seleciona uma.                                                │
           │                                 │                                 │
(Repete o fluxo 1-6 para `fetchPIData(pi)`) │                                 │
           │                                 │                                 │
8. Usuário preenche dados e   │                                 │
   anexa arquivos. Clica em "Enviar".        │                                 │
           │                                 │                                 │
9. `XMLHttpRequest` envia o     │                                 │
   `FormData` (dados + arquivos) │                                 │
   diretamente para o Webhook n8n.           ├─────────────────────────────────► 10. n8n recebe tudo
           │                                 │                                 │
11. UI exibe progresso de upload             │               12. n8n processa:
           │                                 │                   - Salva arquivos no GDrive
           │                                 │                   - Atualiza planilha
           │                                 │                   - Envia e-mails
           │                                 │                                 │
           │                                 ◄─────────────────┤ 13. n8n retorna { success }
           ◄─────────────────────────────────┤                                 │
14. UI exibe mensagem final.                 │                                 │
```

## 📁 Estrutura de Arquivos

Abaixo, uma visão geral dos arquivos e diretórios mais importantes do projeto:

```
.
├── src/
│   ├── app/
│   │   ├── actions.ts       # Server Actions: lógica de comunicação com o n8n.
│   │   ├── globals.css      # Estilos globais e variáveis de tema do Tailwind CSS.
│   │   ├── layout.tsx       # Layout principal da aplicação.
│   │   └── page.tsx         # A página principal (Home) que renderiza o formulário.
│   │
│   ├── components/
│   │   ├── checking-form.tsx # O componente principal do formulário, com toda a lógica de estado e UI.
│   │   └── ui/              # Componentes base do ShadCN (Button, Input, Card, etc.).
│   │
│   └── lib/
│       ├── form-config.ts   # Configuração dos campos de upload condicionais por tipo de mídia.
│       ├── placeholder-images.json # Dados para imagens de placeholder.
│       └── utils.ts         # Funções utilitárias, como o `cn` para classes do Tailwind.
│
├── next.config.ts           # Configurações do Next.js.
├── package.json             # Dependências e scripts do projeto.
└── tailwind.config.ts       # Configurações de tema e plugins do Tailwind CSS.
```

## 🚀 Como Começar (Ambiente Local)

Para clonar e executar este projeto em sua máquina local, siga os passos abaixo. Você precisará ter o [Node.js](https://nodejs.org/) (versão 18 ou superior) instalado.

1.  **Clone o Repositório**

    ```bash
    git clone <url-do-seu-repositorio-github>
    cd <nome-do-repositorio>
    ```

2.  **Instale as Dependências**

    Use o `npm` para instalar todos os pacotes necessários definidos no `package.json`.

    ```bash
    npm install
    ```

3.  **Variáveis de Ambiente**

    Este projeto se conecta a um webhook externo. Embora a URL esteja definida diretamente no código (`actions.ts`), a boa prática é movê-la para uma variável de ambiente. Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:

    ```env
    N8N_WEBHOOK_URL="https://n8n.grupoom.com.br/webhook/CheckingForm"
    ```
    *Lembre-se de adaptar o código em `src/app/actions.ts` para usar `process.env.N8N_WEBHOOK_URL` em vez da string fixa.*

4.  **Execute o Servidor de Desenvolvimento**

    Inicie a aplicação em modo de desenvolvimento com o Turbopack, que oferece recarregamento rápido.

    ```bash
    npm run dev
    ```

5.  **Abra no Navegador**

    Abra [http://localhost:9002](http://localhost:9002) no seu navegador para ver a aplicação em funcionamento.

## 🤝 Como Contribuir

Contribuições são bem-vindas! Se você deseja melhorar este projeto, siga estas diretrizes:

1.  **Fork o Repositório:** Crie uma cópia do projeto em sua própria conta do GitHub.
2.  **Crie uma Branch:** Crie uma branch para sua nova funcionalidade ou correção (`git checkout -b feature/minha-feature` ou `fix/meu-bug`).
3.  **Faça suas Alterações:** Implemente suas mudanças e melhorias.
4.  **Faça o Commit:** Salve suas alterações com uma mensagem de commit clara e descritiva.
5.  **Envie para o GitHub (Push):** `git push origin feature/minha-feature`.
6.  **Abra um Pull Request:** Vá para o repositório original e abra um Pull Request detalhando o que você fez.
