Etapa 1: Exportar o Arquivo do Workflow do n8n
Primeiro, você precisa pegar o "código" do seu workflow. O n8n exporta isso como um arquivo JSON.

Abra seu workflow na interface do n8n.

No canto superior esquerdo, clique no menu "File" (ou "Arquivo").

Vá em "Export" -> "Export to File".

Selecione "JSON" como o formato.

Salve o arquivo no seu computador. Renomeie-o para workflow.json para manter um padrão.

Etapa 2: Adicionar o workflow.json ao GitHub
Agora, vamos fazer o upload desse arquivo para o seu repositório.

Acesse seu repositório no GitHub: https://github.com/phillipebarros-dot/Formulario-Cheking

Clique no botão "Add file" e depois em "Upload files".

Arraste o arquivo workflow.json que você acabou de salvar para a área de upload.

No campo de mensagem do commit, escreva algo como: Adiciona arquivo JSON do workflow n8n.

Clique em "Commit changes".

Etapa 3: Criar a Documentação Detalhada (WORKFLOW.md)
Este novo arquivo será o manual técnico do seu workflow.

Na página principal do seu repositório, clique em "Add file" e depois em "Create new file".

No campo para o nome do arquivo, no topo da página, digite: WORKFLOW.md

No campo grande de edição de texto, copie e cole todo o conteúdo do bloco de código abaixo.

No campo de mensagem do commit, escreva: Cria documentação técnica detalhada do workflow.

Clique em "Commit changes".

Conteúdo para o Arquivo WORKFLOW.md (Copie tudo abaixo)
Markdown

# Análise Técnica do Workflow n8n - Checking OpusMúltipla

Este documento oferece uma análise técnica detalhada, nó por nó, do workflow de automação do formulário de checking. O objetivo é servir como um manual para manutenção, depuração e futuras evoluções do processo.

### Fluxo Geral da Automação

`Formulário Web` ➔ `1. Webhook` ➔ `2. Identificar Ação` ➔ `3. IF Ação` ➔ `[Rota de Busca]` OU `[Rota de Envio Completo]`

---

## Análise Detalhada dos Nós (Node-by-Node)

### 1. Webhook (Recebe do Front-End)
* **Tipo de Nó:** Webhook
* **Objetivo:** É a porta de entrada da automação. Ele gera uma URL única que fica "escutando" as requisições enviadas pelo formulário `index.html`.
* **Configuração Chave:**
    * **HTTP Method:** `POST` - Permite o recebimento de dados, incluindo arquivos.
    * **Path:** `CheckingForm` - Define o endereço final da URL (ex: `.../webhook/CheckingForm`).
    * **Response Mode:** `responseNode` - Permite que um nó específico (`Respond to Webhook`) envie a resposta de volta ao formulário, em vez do próprio Webhook.

### 2. Identificar Ação
* **Tipo de Nó:** Function (Code)
* **Objetivo:** Atua como um "tradutor" da intenção do usuário. Ele inspeciona os dados recebidos para determinar se a requisição é uma simples busca de PI ou uma submissão de formulário completa.
* **Configuração Chave (Código JavaScript):**
    ```javascript
    const body = $json.body || {};
    if (body.action === 'buscar_pi') {
      // Se for uma busca, cria um item simples com o tipo 'buscar_pi'
      return [{ json: { tipo: 'buscar_pi', n_pi: body.n_pi } }];
    } else {
      // Para qualquer outra coisa (a submissão), cria um item com o tipo 'submissao'
      // e anexa todos os dados originais da requisição.
      return [{ json: { tipo: 'submissao', dados: $item.json } }];
    }
    ```

### 3. IF Ação
* **Tipo de Nó:** IF
* **Objetivo:** É o principal roteador do workflow. Com base na saída do nó anterior, ele direciona a execução para o caminho correto.
* **Configuração Chave:**
    * **Condição:** Verifica se o campo `tipo` é igual a `buscar_pi`.
    * **Saída `true`:** Leva para a **Rota de Busca**.
    * **Saída `false`:** Leva para a **Rota de Envio Completo**.

---

### Rota de Busca (Saída `true` do nó "IF Ação")

Este é um fluxo curto e rápido, projetado apenas para devolver informações ao formulário.

#### 4a. Buscar PI (dados)
* **Tipo de Nó:** Google Sheets
* **Objetivo:** Consultar a planilha para verificar se a PI existe e buscar seus dados.
* **Configuração Chave:**
    * **Operation:** `Get Many` (Ler linhas).
    * **Sheet:** Aba `base`.
    * **Filters:** `N_PI` (coluna) `Equals` `{{$json.n_pi}}` (valor vindo do formulário).

#### 5a. Montar Resposta PI
* **Tipo de Nó:** Function (Code)
* **Objetivo:** Formatar a resposta que será enviada de volta ao formulário.
* **Configuração Chave (Código JavaScript):**
    ```javascript
    const piData = $json; // Dados da planilha
    if (!piData || Object.keys(piData).length <= 1) {
      // Se não encontrou dados, retorna um JSON de erro.
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
* **Tipo de Nó:** Respond to Webhook
* **Objetivo:** Enviar a resposta (JSON de sucesso ou erro) de volta para o JavaScript do formulário e **terminar esta execução do workflow**.

---

### Rota de Envio Completo (Saída `false` do nó "IF Ação")

Este é o fluxo principal que executa todas as regras de negócio.

#### 4b. Buscar PI (submissao)
* **Tipo de Nó:** Google Sheets
* **Objetivo:** Revalidar a existência da PI e obter os dados para uso posterior (como o nome do cliente para o e-mail).
* **Configuração Chave:**
    * **Filters:** `N_PI` (coluna) `Equals` `{{$json.dados.body.n_pi}}` (valor vindo do formulário completo).

#### 5b. Verificar PI Existe
* **Tipo de Nó:** IF
* **Objetivo:** Parar o fluxo se a PI enviada no formulário final não existir.
* **Configuração Chave:**
    * **Condição:** Verifica se o número de resultados da busca anterior é igual a 0.
    * **Saída `true`:** Leva a um nó de erro (não detalhado aqui, mas encerraria o fluxo).
    * **Saída `false`:** Permite que o fluxo continue.

#### 6b. Validar Status PI
* **Tipo de Nó:** Function (Code)
* **Objetivo:** Garantir que o checking só seja aceito para PIs com status "ativa".
* **Configuração Chave (Código JavaScript):**
    ```javascript
    const piData = $json;
    if (!piData.Status || piData.Status.toLowerCase() !== 'ativa') {
      throw new Error('A PI informada não está ativa e não pode receber checkings.');
    }
    return $json;
    ```
    *Se a condição for verdadeira, o `throw new Error` interrompe o workflow e retorna uma mensagem de erro ao usuário.*

#### 7b. Validações de Anexos (Cadeia de IFs e Functions)
* **Tipo de Nós:** IF, Function
* **Objetivo:** Verificar se a quantidade de arquivos enviados atende ao mínimo exigido para cada tipo de "Meio".
* **Configuração Chave:**
    * **IFs:** Verificam o valor de `$json.dados.body.meio` (ex: "DO", "ME").
    * **Functions:** Contêm a lógica que conta o número de anexos e usa `throw new Error` se a contagem for menor que a necessária.

#### 8b. Criar Pasta PI
* **Tipo de Nó:** Google Drive
* **Objetivo:** Criar uma pasta única e padronizada para armazenar os comprovantes.
* **Configuração Chave:**
    * **Operation:** `Create Folder`.
    * **Name:** Expressão dinâmica para nomear a pasta (ex: `PI_{{$json.dados.body.n_pi}}`).

#### 9b. Upload Arquivos
* **Tipo de Nó:** Google Drive
* **Objetivo:** Salvar os arquivos enviados pelo usuário na pasta recém-criada.
* **Configuração Chave:**
    * **Operation:** `Upload File`.
    * **Binary Property:** `dados.binary.comprovantes` - Aponta para os dados dos arquivos recebidos pelo Webhook.
    * **Parent Folder ID:** Usa o ID da pasta criada no nó anterior.

#### 10b. Registrar Log
* **Tipo de Nó:** Google Sheets
* **Objetivo:** Criar uma trilha de auditoria, registrando cada submissão bem-sucedida.
* **Configuração Chave:**
    * **Operation:** `Append` (Adicionar linha).
    * **Sheet:** Aba `Log_Checkings`.
    * **Columns:** Mapeia os dados relevantes (`PI`, `Cliente`, `Data`, `Qtd_Arquivos`, etc.) para as colunas da planilha.

#### 11b. Enviar Notificação
* **Tipo de Nó:** Send Email
* **Objetivo:** Comunicar à equipe interna que um novo checking foi recebido e processado.
* **Configuração Chave:**
    * **To/From:** Endereços de e-mail dos destinatários.
    * **Subject/Body:** Conteúdo do e-mail, usando expressões para inserir dados dinâmicos como o número da PI e o nome do cliente.

#### 12b. Responder Sucesso
* **Tipo de Nó:** Respond to Webhook
* **Objetivo:** Enviar a mensagem final de sucesso de volta para o formulário e **terminar esta execução do workflow**.
  
Etapa 4: Lincar a Nova Documentação no README.md (Recomendado)
Para que as pessoas encontrem essa documentação técnica facilmente, adicione um link para ela no seu arquivo README.md principal.

Edite seu arquivo README.md.

Encontre a seção ## 🤖 Como Funciona a Automação (n8n).

No final dessa seção, adicione a seguinte linha:

Para uma análise técnica detalhada de cada nó do workflow, [consulte a documentação completa aqui](./WORKFLOW.md).
