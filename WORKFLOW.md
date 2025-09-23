
````markdown
# Análise Técnica do Workflow n8n: **Formulário de Verificação**

Este documento oferece uma visão detalhada do fluxo de trabalho automatizado no n8n, que gerencia o formulário de verificação. O workflow foi projetado para receber dados via webhook e processar dois tipos de ações principais: **Busca de PI** e **Envio de Verificação**. A seguir, estão descritos todos os detalhes do fluxo de trabalho, incluindo configurações, explicações sobre cada nó e o código JavaScript usado nos nós de tipo *Function*.

### **Índice**

1. [Visão Geral do Fluxo de Trabalho](#fluxo-geral-da-automação)
2. [Diagrama Textual do Fluxo Principal](#diagrama-textual-do-fluxo-principal)
3. [JSON do Workflow](#json-do-workflow)
4. [Fluxos de Erro e Validações](#fluxos-de-erro)
5. [Dicas de Manutenção e Depuração](#dicas-de-manutenção-e-depuração)

---

## **Visão Geral do Fluxo de Trabalho**

O fluxo de trabalho é projetado para funcionar como um "roteador" inteligente, recebendo requisições POST no webhook e processando-as de acordo com a ação indicada. Ele lida com duas ações principais via um único webhook:

1. **Busca de PI:** Retorna dados de um PI (Pedido Interno) da planilha do Google Sheets para preencher o formulário no front-end.
2. **Envio de Verificação:** Valida dados e arquivos, cria uma pasta no Google Drive, faz o upload dos arquivos, registra um log na planilha e envia uma notificação por e-mail.

### **Versão do Workflow**
- **Base:** Exportação n8n v1.x
- **Última Atualização:** [Insira dados aqui ao comprometer]

---

## **Fluxo Geral da Automação**

O workflow recebe uma requisição POST no webhook, identifica a ação e segue uma das duas rotas:

### **Diagrama Textual do Fluxo Principal**

```text
Webhook (Recebe do Front-End)
↓
Identificar Ação (Function: Verifica body.action)
↓
IF Ação (IF: tipo == 'buscar_pi'?)
├─ TRUE: Rota de Busca
│   ↓
│   Buscar PI (dados) (Google Sheets: Filtra por N_PI)
│   ↓
│   Montar Resposta PI (Function: Formata dados ou erro)
│   ↓
│   Responder Dados PI (RespondToWebhook: Envia JSON de sucesso/erro)
└─ FALSE: Rota de Submissão
    ↓
    Agregar Arquivos (Function: Padroniza binários)
    ↓
    Buscar PI (submissao) (Google Sheets: Verifica existência)
    ↓
    Verificar PI Existe (IF: $items().length == 0?)
    ├─ TRUE: Responder Erro PI (RespondToWebhook: Erro "PI não encontrada")
    └─ FALSE:
        ↓
        Validar Status PI (Function: Checa se Status == 'ativa')
        ↓
        (Se erro, workflow para com throw Error)
        ↓
        IF Meio é DO? (IF: dados.body.meio == 'DO'?)
        ├─ TRUE: Validar Anexos DO (Function: Checa 3 arquivos obrigatórios)
        └─ FALSE:
            ↓
            IF Meio é ME ou MO? (IF: meio includes 'ME,MO'?)
            ├─ TRUE: Validar Anexos ME MO (Function: Checa 2 arquivos)
            └─ FALSE:
                ↓
                Validar Anexo Geral (Function: Checa 1 arquivo)
                ↓
                Merge (Une fluxos)
    ↓
    Criar Pasta PI (Google Drive: Cria pasta nomeada)
    ↓
    Upload Arquivos (Google Drive: Upload binários para pasta)
    ↓
    Registrar Log (Google Sheets: Append linha no log)
    ↓
    Enviar Notificação (Email: SMTP para notificar)
    ↓
    Responder Sucesso (RespondToWebhook: {success: true})
````

---

## **JSON do Workflow**

O fluxo completo do workflow, incluindo todos os nós e parâmetros, está disponível no formato JSON. Copie o JSON abaixo para importar o fluxo no n8n.

```json
{
  "nodes": [
    {
      "parameters": {
        "fromEmail": "phillipe.barros@grupoom.com.br",
        "toEmail": "grupoom.com.br",
        "subject": "Checking Validado - PI {{$json.dados.body.pi}}",
        "text": "=O checking para a PI {{$json.dados.body.pi}} foi enviado e validado com sucesso.\n\nCliente: {{$json.data[0].cliente}}\nVeículo: {{$json.dados.body.veiculo}}\nCampanha: {{$json.data[0].campanha}}\nProduto: {{$json.data[0].produto}}\nPeríodo: {{$json.data[0].periodo}}\n\nArquivos enviados: {{$json.dados.binary.comprovantes ? $json.dados.binary.comprovantes.length : 0}}",
        "options": {}
      },
      "name": "Enviar Notificação",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 1,
      "position": [400, 1168],
      "id": "582e8ba9-3e30-404c-a322-600b56a3553f",
      "credentials": {
        "smtp": {
          "id": "RWkmYjbSwCOVqlXN",
          "name": "SMTP account"
        }
      }
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.dados.body.meio}}",
              "value2": "DO"
            }
          ]
        }
      },
      "id": "f3521cba-57a6-46c4-8576-bee1ba55ef18",
      "name": "IF Meio é DO?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [-832, 1168]
    },
    ...
  ]
}
```

---

## **Fluxos de Erro**

### **Erros Comuns e Tratamento**

1. **PI não encontrada ou inativa:**

   * Caso o PI não seja encontrado ou esteja marcado como inativo, o workflow retorna um erro com a mensagem `{error: 'PI não encontrada ou inativa.'}`.
   * O fluxo é interrompido nesse ponto.

2. **Validações de Arquivos Faltando:**

   * Quando um arquivo obrigatório não é enviado, a validação lança um erro, interrompendo o fluxo com um erro HTTP 500 e a mensagem específica.

3. **Falhas de API (Google Sheets/Drive):**

   * Se ocorrer um erro com as APIs do Google Sheets ou Google Drive, o n8n captura o erro e o envia para o nó `RespondToWebhook` ou o registra no console para análise posterior.

---

## **Dicas de Manutenção e Depuração**

* **Depuração de Dados:**
  Utilize a função de log no n8n para imprimir os dados intermediários com `console.log()`. Isso ajuda a identificar problemas no fluxo, especialmente em dados malformados ou ausentes.

* **Monitoramento de Erros:**
  Se ocorrerem falhas nas APIs externas (como Google Sheets ou Google Drive), verifique as credenciais e o acesso às APIs. Certifique-se de que as permissões estão corretamente configuradas.

* **Ajustes em Arquivos:**
  Para depurar problemas de envio de arquivos, use o nó *Function* para inspecionar o conteúdo dos arquivos binários antes de enviá-los para o Google Drive.

---

```

