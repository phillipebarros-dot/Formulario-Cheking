

### **Etapa 1: Exporte o Arquivo do seu Workflow**

Primeiro, você precisa extrair o "código-fonte" do seu workflow do n8n.

1.  Abra seu workflow na interface do n8n.
2.  No canto superior esquerdo, clique no menu **"File"** (Arquivo).
3.  Vá em **"Export"** -\> **"Export to File"**.
4.  Selecione **"JSON"** como o formato.
5.  Salve o arquivo no seu computador. Para manter um padrão, renomeie-o para **`workflow.json`**.

### **Etapa 2: Adicione os Arquivos ao seu Repositório GitHub**

Agora, vamos fazer o upload do `workflow.json` e criar o novo arquivo de documentação.

1.  **Faça o upload do `workflow.json`:**

      * Acesse seu repositório no GitHub.
      * Clique em **"Add file"** \> **"Upload files"**.
      * Arraste o arquivo **`workflow.json`** que você salvou para a área de upload.
      * Escreva uma mensagem de commit (ex: `Adiciona arquivo JSON do workflow n8n`) e clique em **"Commit changes"**.

2.  **Crie o arquivo de documentação `WORKFLOW.md`:**

      * Na página principal do seu repositório, clique em **"Add file"** \> **"Create new file"**.
      * No campo para o nome do arquivo, digite: **`WORKFLOW.md`**
      * No campo grande de edição, **copie e cole todo o conteúdo** que preparei para você abaixo.
      * Escreva uma mensagem de commit (ex: `Cria documentação técnica detalhada do workflow`) e clique em **"Commit changes"**.

### **Etapa 3: Vincule a Nova Documentação no `README.md` (Recomendado)**

Para que todos encontrem facilmente esta nova documentação, vamos adicionar um link a ela no seu `README.md` principal.

1.  Edite seu arquivo `README.md`.

2.  Encontre a seção `## 🤖 Como Funciona a Automação (n8n)`.

3.  No final dessa seção, adicione a seguinte linha:

    ```markdown
    Para uma análise técnica detalhada de cada nó do workflow, **[consulte a documentação completa aqui](./WORKFLOW.md)**.
    ```

-----

### **Conteúdo para o Arquivo `WORKFLOW.md` (Copie tudo abaixo)**

````markdown
# Análise Técnica Detalhada do Workflow n8n

Este documento oferece uma análise técnica detalhada, nó por nó, do workflow de automação do formulário de checking. O objetivo é servir como um manual para manutenção, depuração e futuras evoluções do processo.

### Fluxo Geral da Automação

`Formulário Web` ➔ `1. Webhook` ➔ `2. Identificar Ação` ➔ `3. IF Ação` ➔ `[Rota de Busca]` OU `[Rota de Envio Completo]`

---

## Análise Detalhada dos Nós (Node-by-Node)

### 1. Webhook (Recebe do Front-End)
* **Tipo de Nó:** `Webhook`
* **Objetivo:** É a porta de entrada da automação. Gera uma URL única que fica "escutando" as requisições enviadas pelo formulário `index.html`.
* **Configuração Chave:**
    * **HTTP Method:** `POST` - Permite o recebimento de dados, incluindo o upload de arquivos (`multipart/form-data`).
    * **Path:** `CheckingForm` - Define o endereço final da URL.
    * **Response Mode:** `responseNode` - Delega a tarefa de enviar a resposta de volta ao formulário para um nó específico (`Respond to Webhook`), permitindo fluxos mais complexos.

### 2. Identificar Ação
* **Tipo de Nó:** `Function` (Code)
* **Objetivo:** Atua como um "tradutor" da intenção do usuário. Ele inspeciona os dados recebidos para determinar se a requisição é uma busca de PI ou uma submissão de formulário.
* **Código JavaScript:**
    ```javascript
    const body = $json.body || {};
    if (body.action === 'buscar_pi') {
      // Se for uma busca, cria um item simples com o tipo 'buscar_pi' e o n_pi.
      return [{ json: { tipo: 'buscar_pi', n_pi: body.n_pi } }];
    } else {
      // Para a submissão, cria um item com o tipo 'submissao' e anexa todos os dados originais.
      return [{ json: { tipo: 'submissao', dados: $item.json } }];
    }
    ```

### 3. IF Ação
* **Tipo de Nó:** `IF`
* **Objetivo:** É o principal roteador do workflow. Com base na saída do nó anterior, direciona a execução para o caminho correto.
* **Configuração Chave:**
    * **Condição:** Verifica se o campo `tipo` é igual a `buscar_pi`.
    * **Saída `true`:** Leva para a **Rota de Busca**.
    * **Saída `false`:** Leva para a **Rota de Envio Completo**.

---

### Rota de Busca (Fluxo Rápido de Consulta)

#### 4a. Buscar PI (dados)
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Consultar a planilha para verificar se a PI existe e buscar seus dados.
* **Configuração Chave:**
    * **Operation:** `Get Many` (Ler linhas).
    * **Sheet:** Aba `base`.
    * **Filters:** `N_PI` (coluna) `Equals` `{{$json.n_pi}}`.

#### 5a. Montar Resposta PI
* **Tipo de Nó:** `Function` (Code)
* **Objetivo:** Formatar a resposta (JSON) que será enviada de volta ao formulário, seja com os dados encontrados ou com uma mensagem de erro.
* **Código JavaScript:**
    ```javascript
    const piData = $json;
    // Verifica se a busca retornou um objeto com dados.
    if (!piData || Object.keys(piData).length <= 1) {
      return [{ json: { error: 'PI não encontrada' } }];
    }
    // Se encontrou, retorna um JSON de sucesso com os dados formatados.
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
* **Objetivo:** Enviar a resposta (JSON de sucesso ou erro) para o JavaScript do formulário e **terminar esta execução do workflow**.

---

### Rota de Envio Completo (Fluxo Principal)

#### 4b. Buscar PI (submissao)
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Revalidar a existência da PI e obter os dados para uso posterior (ex: nome do cliente para o e-mail).
* **Configuração Chave:**
    * **Filters:** `N_PI` `Equals` `{{$json.dados.body.n_pi}}`.

#### 5b. Verificar PI Existe
* **Tipo de Nó:** `IF`
* **Objetivo:** Parar o fluxo se a PI enviada no formulário final não existir.
* **Configuração Chave:**
    * **Condição:** Verifica se o número de resultados da busca anterior é igual a `0`.

#### 6b. Validar Status PI
* **Tipo de Nó:** `Function` (Code)
* **Objetivo:** Garantir que o checking só seja aceito para PIs com status "ativa".
* **Código JavaScript:**
    ```javascript
    const piData = $json;
    if (!piData.Status || piData.Status.toLowerCase() !== 'ativa') {
      // Interrompe o workflow e retorna uma mensagem de erro ao usuário.
      throw new Error('A PI informada não está ativa e não pode receber checkings.');
    }
    return $json;
    ```

#### 7b. Validações de Anexos (Cadeia de IFs e Functions)
* **Tipo de Nós:** `IF`, `Function`
* **Objetivo:** Verificar se a quantidade de arquivos enviados atende ao mínimo exigido para cada tipo de "Meio".
* **Configuração Chave:** Os `IF`s verificam o valor de `$json.dados.body.meio` e direcionam para `Function`s que contam os anexos e disparam um erro (`throw new Error`) se a contagem for insuficiente.

#### 8b. Criar Pasta PI
* **Tipo de Nó:** `Google Drive`
* **Objetivo:** Criar uma pasta única e padronizada para os comprovantes.
* **Configuração Chave:**
    * **Operation:** `Create Folder`.
    * **Name:** `PI_{{$json.dados.body.n_pi}}` (expressão dinâmica).

#### 9b. Upload Arquivos
* **Tipo de Nó:** `Google Drive`
* **Objetivo:** Salvar os arquivos enviados pelo usuário na pasta recém-criada.
* **Configuração Chave:**
    * **Operation:** `Upload File`.
    * **Binary Property:** `dados.binary.comprovantes` (aponta para os dados dos arquivos).
    * **Parent Folder ID:** `{{$node["Criar Pasta PI"].json.id}}` (usa o ID da pasta criada no passo anterior).

#### 10b. Registrar Log
* **Tipo de Nó:** `Google Sheets`
* **Objetivo:** Criar uma trilha de auditoria, registrando cada submissão bem-sucedida.
* **Configuração Chave:**
    * **Operation:** `Append` (Adicionar linha).
    * **Sheet:** Aba `Log_Checkings`.
    * **Columns:** Mapeia os dados relevantes (`PI`, `Cliente`, `Data`, etc.) para as colunas da planilha.

#### 11b. Enviar Notificação
* **Tipo de Nó:** `Send Email`
* **Objetivo:** Comunicar à equipe interna que um novo checking foi recebido.
* **Configuração Chave:**
    * **To/From/Subject/Body:** Campos preenchidos com os e-mails dos destinatários e conteúdo dinâmico usando expressões.

#### 12b. Responder Sucesso
* **Tipo de Nó:** `Respond to Webhook`
* **Objetivo:** Enviar a mensagem final de sucesso de volta para o formulário e **terminar esta execução do workflow**.
