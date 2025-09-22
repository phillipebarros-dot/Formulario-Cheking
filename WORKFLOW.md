# Análise Técnica Detalhada do Workflow n8n

Este documento oferece uma análise técnica detalhada, nó por nó, do workflow de automação do formulário de checking, com foco especial na lógica e construção dos códigos JavaScript customizados. O objetivo é servir como um manual para manutenção, depuração e futuras evoluções do processo.

### Fluxo Geral da Automação

`Formulário Web` ➔ `1. Webhook` ➔ `2. Identificar Ação` ➔ `3. IF Ação` ➔ `[Rota de Busca]` OU `[Rota de Envio Completo]`

---

## Análise dos Nós (Node-by-Node)

*A descrição dos nós principais (Webhook, IF, Google Sheets, etc.) permanece a mesma da versão anterior.*

---

## Análise dos Códigos JavaScript (Nós `Function`)

Esta seção detalha a construção e a lógica por trás de cada nó `Function`, que contém os scripts que dão inteligência ao nosso workflow.

### 1. Nó: `Identificar Ação`

* **Objetivo Estratégico:** Criar um "roteador" inicial. O formulário usa o mesmo Webhook para duas finalidades diferentes (buscar dados e enviar o formulário). Este código atua como um porteiro que olha para a "bagagem" de cada requisição e a etiqueta para que o nó `IF Ação` saiba para onde enviá-la.

* **O Código Explicado:**

    ```javascript
    // 1. Acessa o 'body' da requisição. Se não existir, cria um objeto vazio para evitar erros.
    const body = $json.body || {};

    // 2. Verifica se dentro do 'body' existe um campo 'action' com o valor 'buscar_pi'.
    if (body.action === 'buscar_pi') {
      
      // 3. Se a condição for verdadeira, ele constrói e retorna um novo objeto JSON simples.
      //    Isso limpa a requisição, deixando apenas o que a Rota de Busca precisa.
      return [{ json: { tipo: 'buscar_pi', n_pi: body.n_pi } }];

    } else {
      
      // 4. Se a condição for falsa, significa que é uma submissão de formulário.
      //    Ele constrói um objeto que aninha TODOS os dados originais (body, files, etc.)
      //    dentro de uma propriedade chamada 'dados', facilitando o acesso nas etapas seguintes.
      return [{ json: { tipo: 'submissao', dados: $item.json } }];
    }
    ```

* **Por que foi construído assim?**
    * Para manter o workflow organizado, separando completamente a lógica de busca e de envio.
    * A criação do objeto `{ tipo: '...' }` permite que o nó `IF` seguinte tenha uma condição de verificação simples e clara.

### 2. Nó: `Montar Resposta PI` (Na Rota de Busca)

* **Objetivo Estratégico:** Atuar como um "Assessor de Imprensa". Ele pega os dados brutos vindos da planilha e os formata em uma resposta limpa e padronizada que o JavaScript do formulário consiga entender e utilizar facilmente.

* **O Código Explicado:**

    ```javascript
    // 1. `$json` aqui contém o resultado da busca no Google Sheets.
    const piData = $json;

    // 2. Faz uma verificação de segurança. Se o objeto `piData` não existir ou estiver
    //    praticamente vazio (só com metadados), significa que a PI não foi encontrada.
    if (!piData || Object.keys(piData).length <= 1) {
      
      // 3. Nesse caso, ele retorna um objeto JSON com uma chave 'error'. O JavaScript do
      //    formulário está programado para procurar essa chave e exibir a mensagem.
      return [{ json: { error: 'PI não encontrada ou inativa.' } }];
    }

    // 4. Se os dados foram encontrados, ele constrói um objeto de sucesso.
    return [{
      json: {
        success: true, // Sinaliza para o formulário que a operação deu certo.
        // 5. Mapeia os nomes das colunas da planilha (ex: 'CLIENTE') para chaves
        //    amigáveis (ex: 'cliente'). O `|| ''` é uma segurança para garantir
        //    que, se um campo estiver vazio na planilha, ele envie uma string vazia
        //    em vez de `null`, evitando erros no front-end.
        cliente: piData.CLIENTE || '',
        campanha: piData.CAMPANHA || '',
        produto: piData.PRODUTO || '',
        periodo: piData.PERIODO || '',
        veiculo: piData.VEICULO || '',
        meio: piData.MEIO || ''
      }
    }];
    ```

* **Por que foi construído assim?**
    * Para criar um "contrato de API" claro entre o back-end (n8n) e o front-end (`index.html`). O formulário sempre saberá o que esperar: um objeto com a chave `success` ou `error`.
    * Para tratar dados nulos (`|| ''`), tornando o front-end mais resiliente a falhas ou campos em branco na planilha.

### 3. Nó: `Validar Status PI` (Na Rota de Envio)

* **Objetivo Estratégico:** Atuar como um "Guarda de Segurança" ou "Auditor". Sua única função é aplicar uma regra de negócio crítica: PIs que não estão "ativas" não podem receber novos checkings.

* **O Código Explicado:**

    ```javascript
    // 1. `$json` aqui contém os dados da PI que foram revalidados no passo anterior.
    const piData = $json;

    // 2. Esta é a condição de validação. Ela verifica duas coisas:
    //    - `!piData.Status`: A PI não tem uma coluna de Status preenchida? (Falha)
    //    - `piData.Status.toLowerCase() !== 'ativa'`: O status existe, mas não é 'ativa'? (Falha)
    //    O `.toLowerCase()` garante que a verificação funcione para "Ativa", "ativa" ou "ATIVA".
    if (!piData.Status || piData.Status.toLowerCase() !== 'ativa') {
      
      // 3. Se a condição for verdadeira, usamos `throw new Error()`. Isso tem um efeito
      //    especial no n8n: ele **interrompe a execução do workflow imediatamente** e
      //    envia a mensagem de erro de volta para o formulário.
      throw new Error('A PI informada não está ativa e não pode receber checkings.');
    }

    // 4. Se a PI passar na validação, o nó simplesmente retorna os dados para o próximo passo.
    return $json;
    ```

* **Por que foi construído assim?**
    * O uso de `throw new Error` é a maneira mais eficiente e correta de interromper um fluxo no n8n com base em uma falha de lógica de negócio, retornando um erro claro para o usuário.
    * Isso impede que o workflow execute ações desnecessárias (como criar pastas ou salvar arquivos) para uma PI inválida.

### 4. Nós: `Validar Anexos ME / DO` (Na Rota de Envio)

* **Objetivo Estratégico:** Atuar como um "Fiscal de Documentos". Ele aplica regras de negócio específicas que dependem do tipo de "Meio", garantindo que a submissão esteja completa antes de prosseguir.

* **O Código Explicado (Exemplo para "DO"):**
    ```javascript
    // 1. Acessamos os arquivos, que estão aninhados dentro da estrutura de dados.
    const anexos = $json.dados.binary.comprovantes;

    // 2. A condição verifica se a propriedade 'anexos' não existe ou se a quantidade
    //    de itens na lista (`.length`) é menor que o mínimo exigido (neste caso, 3).
    if (!anexos || anexos.length < 3) {
      
      // 3. Se a condição falhar, ele interrompe o workflow com uma mensagem de erro específica.
      throw new Error('Para DO, mínimo de 3 anexos são necessários.');
    }

    // 4. Se a quantidade de anexos for suficiente, retorna os dados para o próximo nó.
    return $json;
    ```

* **Por que foi construído assim?**
    * Para modularizar as regras de negócio. Em vez de um grande bloco de código, temos pequenos nós especializados, tornando o workflow mais fácil de ler e de dar manutenção.
    * Novas validações para outros tipos de "Meio" podem ser facilmente adicionadas no futuro, sem alterar os nós existentes.
