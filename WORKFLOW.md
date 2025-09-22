# Análise Técnica Detalhada do Workflow n8n

Este documento oferece uma análise técnica detalhada, nó por nó, do workflow de automação do formulário de checking. O objetivo é servir como um manual para manutenção, depuração e futuras evoluções do processo.

### Fluxo Geral da Automação

`Formulário Web` ➔ `1. Webhook` ➔ `2. Identificar Ação` ➔ `3. IF Ação` ➔ `[Rota de Busca]` OU `[Rota de Envio Completo]`

---

## Análise Detalhada dos Nós (Node-by-Node)

### 1. Webhook (Recebe do Front-End)
* **Tipo de Nó:** `Webhook`
* **Objetivo:** Ponto de entrada da automação. Gera uma URL única que "escuta" as requisições enviadas pelo formulário.
* **Configuração Chave:** `HTTP Method: POST`, `Path: CheckingForm`, `Response Mode: responseNode`.

### 2. Identificar Ação
* **Tipo de Nó:** `Function`
* **Objetivo:** "Traduzir" a intenção do usuário, diferenciando uma busca de PI de uma submissão completa.
* **Código JavaScript:**
    ```javascript
    const body = $json.body || {};
    if (body.action === 'buscar_pi') {
      return [{ json: { tipo: 'buscar_pi', n_pi: body.n_pi } }];
    } else {
      return [{ json: { tipo: 'submissao', dados: $item.json } }];
    }
    ```

### 3. IF Ação
* **Tipo de Nó:** `IF`
* **Objetivo:** Roteador principal do workflow.
* **Configuração Chave:** Condição que verifica se `tipo == 'buscar_pi'`.
    * **Saída `true`:** Leva para a **Rota de Busca**.
    * **Saída `false`:** Leva para a **Rota de Envio Completo**.

---

### Rota de Busca (Fluxo Rápido de Consulta)

*Esta seção permanece a mesma da documentação anterior, pois está correta.*

#### 4a. Buscar PI (dados)
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Consultar a planilha para buscar os dados da PI solicitada.

#### 5a. Montar Resposta PI
* **Tipo de Nó:** `Function`
* **Objetivo:** Formatar a resposta (JSON) de sucesso ou erro para o formulário.

#### 6a. Responder Dados PI
* **Tipo de Nó:** `Respond to Webhook`
* **Objetivo:** Enviar a resposta para o formulário e terminar a execução.

---

### Rota de Envio Completo (Fluxo Principal)

*Esta seção foi completamente reescrita para refletir o workflow real.*

#### 4b. Buscar PI (submissao)
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Revalidar a existência da PI no momento do envio final.

#### 5b. Verificar PI Existe
* **Tipo de Nó:** `IF`
* **Objetivo:** Primeiro ponto de verificação. Garante que o fluxo só continue se a PI for encontrada na planilha.
* **Configuração Chave:**
    * **Condição:** Verifica se o número de resultados da busca anterior é igual a `0`.
    * **Saída `true` (PI não existe):** Leva para o nó `Responder Erro PI`.
    * **Saída `false` (PI existe):** Continua para `Validar Status PI`.

#### 6b. Responder Erro PI
* **Tipo de Nó:** `Respond to Webhook`
* **Objetivo:** Enviar uma mensagem de erro ao usuário e **encerrar o workflow** caso a PI não seja encontrada.

#### 7b. Validar Status PI
* **Tipo de Nó:** `Function`
* **Objetivo:** Segundo ponto de verificação. Garante que o checking só seja aceito para PIs com status "ativa".
* **Código JavaScript:**
    ```javascript
    const piData = $json;
    if (!piData.Status || piData.Status.toLowerCase() !== 'ativa') {
      throw new Error('A PI informada não está ativa e não pode receber checkings.');
    }
    return $json;
    ```

#### 8b. IF Veículo é ME?
* **Tipo de Nó:** `IF`
* **Objetivo:** Inicia a validação da quantidade de anexos. Primeiro, verifica se o veículo é do tipo "ME".
* **Configuração Chave:**
    * **Condição:** Verifica se `$json.dados.body.meio == 'ME'`.
    * **Saída `true`:** Leva para `Validar Anexos ME`.
    * **Saída `false`:** Continua a verificação em `IF Veículo é DO?`.

#### 9b. Validar Anexos ME
* **Tipo de Nó:** `Function`
* **Objetivo:** Garante o número mínimo de anexos para o veículo "ME".
* **Código JavaScript (Exemplo):**
    ```javascript
    const anexos = $json.dados.binary.comprovantes;
    if (!anexos || anexos.length < 2) { // Exemplo: mínimo de 2 anexos
      throw new Error('Para ME, mínimo de 2 anexos são necessários.');
    }
    return $json;
    ```
    *Após a validação, o fluxo segue para `Criar Pasta PI`.*

#### 10b. IF Veículo é DO?
* **Tipo de Nó:** `IF`
* **Objetivo:** Segunda parte da validação de anexos. Verifica se o veículo é do tipo "DO".
* **Configuração Chave:**
    * **Condição:** Verifica se `$json.dados.body.meio == 'DO'`.
    * **Saída `true`:** Leva para `Validar Anexos DO`.
    * **Saída `false`:** Se não for nem "ME" nem "DO", o fluxo pula a validação de anexos e vai direto para `Criar Pasta PI`.

#### 11b. Validar Anexos DO
* **Tipo de Nó:** `Function`
* **Objetivo:** Garante o número mínimo de anexos para o veículo "DO".
* **Código JavaScript (Exemplo):**
    ```javascript
    const anexos = $json.dados.binary.comprovantes;
    if (!anexos || anexos.length < 3) { // Exemplo: mínimo de 3 anexos
      throw new Error('Para DO, mínimo de 3 anexos são necessários.');
    }
    return $json;
    ```
    *Após a validação, o fluxo segue para `Criar Pasta PI`.*

#### 12b. Criar Pasta PI
* **Tipo de Nó:** `Google Drive`
* **Objetivo:** Ponto de convergência. Cria uma pasta única para os comprovantes, independente da rota de validação anterior.
* **Configuração Chave:** `Operation: Create Folder`, `Name: PI_{{$json.dados.body.n_pi}}`.

#### 13b. Upload Arquivos
* **Tipo de Nó:** `Google Drive`
* **Objetivo:** Salvar os arquivos do formulário na pasta criada.

#### 14b. Registrar Log
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Criar a trilha de auditoria na planilha `Log_Checkings`.

#### 15b. Enviar Notificação
* **Tipo de Nó:** `Send Email`
* **Objetivo:** Enviar o e-mail de confirmação para a equipe.

#### 16b. Responder Sucesso
* **Tipo de Nó:** `Respond to Webhook`
* **Objetivo:** Enviar a mensagem final de sucesso para o formulário e encerrar o workflow.
