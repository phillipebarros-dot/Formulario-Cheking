

```markdown
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

#### 4a. Buscar PI (dados)
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Consultar a planilha para buscar os dados da PI solicitada.

#### 5a. Montar Resposta PI
* **Tipo de Nó:** `Function`
* **Objetivo:** Formatar a resposta (JSON) que será enviada de volta ao formulário.
* **Código JavaScript:**
    ```javascript
    const piData = $json;
    if (!piData || Object.keys(piData).length <= 1) {
      return [{ json: { error: 'PI não encontrada ou inativa.' } }];
    }
    return [{
      json: {
        success: true,
        cliente: piData.CLIENTE || '',
        campanha: piData.CAMPANHA || '',
        produto: piData.PRODUTO || '',
        periodo: piData.PERIODO || '',
        veiculo: piData.VEICULO || '',
        meio: piData.MEIO || ''
      }
    }];
    ```

#### 6a. Responder Dados PI
* **Tipo de Nó:** `Respond to Webhook`
* **Objetivo:** Enviar a resposta para o formulário e terminar a execução.

---

### Rota de Envio Completo (Fluxo Principal)

#### 4b. Buscar PI (submissao)
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Revalidar a existência da PI no momento do envio final.

#### 5b. Verificar PI Existe
* **Tipo de Nó:** `IF`
* **Objetivo:** Primeiro ponto de verificação. Garante que o fluxo só continue se a PI for encontrada.
* **Saída `true` (PI não existe):** Leva para `Responder Erro PI`.
* **Saída `false` (PI existe):** Continua para `Validar Status PI`.

#### 6b. Responder Erro PI
* **Tipo de Nó:** `Respond to Webhook`
* **Objetivo:** Enviar uma mensagem de erro ao usuário e encerrar o workflow caso a PI não seja encontrada.

#### 7b. Validar Status PI
* **Tipo de Nó:** `Function`
* **Objetivo:** Garantir que o checking só seja aceito para PIs com status "ativa".
* **Código JavaScript:**
    ```javascript
    const piData = $json;
    if (!piData.Status || piData.Status.toLowerCase() !== 'ativa') {
      throw new Error('A PI informada não está ativa e não pode receber checkings.');
    }
    return $json;
    ```

#### 8b. Cadeia de Validação de Anexos (`IF Veículo é ME?`, `IF Veículo é DO?`, etc.)
* **Tipo de Nós:** `IF`, `Function`
* **Objetivo:** Verificar se a quantidade de arquivos enviados atende ao mínimo exigido para cada tipo de "Meio".
* **Lógica:** Uma sequência de nós `IF` verifica o valor de `$json.dados.body.meio`. Se for um tipo que exige validação, o fluxo é direcionado para um nó `Function` específico que conta os anexos e dispara um erro (`throw new Error`) se a contagem for insuficiente. Se não for um tipo especial, o fluxo pula esta etapa.

#### 9b. Criar Pasta PI
* **Tipo de Nó:** `Google Drive`
* **Objetivo:** Ponto de convergência. Cria uma pasta única para os comprovantes.
* **Configuração Chave:** `Operation: Create Folder`, `Name: PI_{{$json.dados.body.n_pi}}`.

#### 10b. Upload Arquivos
* **Tipo de Nó:** `Google Drive`
* **Objetivo:** Salvar os arquivos do formulário na pasta criada.

#### 11b. Registrar Log
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Criar a trilha de auditoria na planilha `Log_Checkings`.

#### 12b. Enviar Notificação
* **Tipo de Nó:** `Send Email`
* **Objetivo:** Enviar o e-mail de confirmação para a equipe.

#### 13b. Responder Sucesso
* **Tipo de Nó:** `Respond to Webhook`
* **Objetivo:** Enviar a mensagem final de sucesso para o formulário e encerrar o workflow.

---

### 🧪 Testando o Fluxo de Envio com Segurança

Para testar o workflow sem criar pastas, registrar logs ou enviar e-mails reais, utilize uma das seguintes estratégias:

#### Método 1: Desativar Nós (Simples e Rápido)
1.  Na interface do n8n, clique com o **botão direito** nos nós de produção (`Criar Pasta PI`, `Upload Arquivos`, `Registrar Log`, `Enviar Notificação`).
2.  Selecione **"Deactivate" (Desativar)**. Os nós ficarão cinza.
3.  Execute o workflow a partir do formulário. O fluxo de dados irá parar nos nós desativados.
4.  Clique em um nó desativado e inspecione sua aba **"Input"** para verificar se os dados que chegaram até ali estão corretos.
5.  Lembre-se de reativar os nós ("Activate") quando terminar os testes.

#### Método 2: Usar um "PI de Teste" com um Nó IF (Avançado)
1.  Defina um número de PI que será usado apenas para testes (ex: `TESTE-999`).
2.  No workflow, adicione um nó `IF` antes do `Criar Pasta PI`.
3.  Configure a condição para verificar se a PI é a de teste: `{{$json.dados.body.n_pi}}` `Equals` `TESTE-999`.
4.  Conecte a saída **`false`** (envio real) ao restante do fluxo (`Criar Pasta PI`).
5.  Deixe a saída **`true`** (é um teste) desconectada. Isso fará com que qualquer execução com a PI de teste pare nesse ponto de forma segura.
