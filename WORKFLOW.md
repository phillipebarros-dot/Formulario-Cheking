# Análise Técnica Detalhada do Workflow n8n

Este documento oferece uma análise técnica detalhada, nó por nó, do workflow de automação do formulário de checking, com foco especial na lógica e construção dos códigos JavaScript customizados. O objetivo é servir como um manual para manutenção, depuração e futuras evoluções do processo.

### Fluxo Geral da Automação

`Formulário Web` ➔ `1. Webhook` ➔ `2. Identificar Ação` ➔ `3. IF Ação` ➔ `[Rota de Busca]` OU `[Rota de Envio Completo]`

---

## JSON do Workflow (Exportação n8n)

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
      "position": [
        400,
        1168
      ],
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
      "position": [
        -832,
        1168
      ]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.dados.body.meio}}",
              "operation": "includes",
              "value2": "ME,MO"
            }
          ]
        }
      },
      "id": "a1f644d5-4211-412b-84aa-50a25f9f7a70",
      "name": "IF Meio é ME ou MO?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [
        -832,
        1328
      ]
    },
    {
      "parameters": {
        "functionCode": "// Processa todos os items recebidos\nconst results = [];\n\nfor (const item of items) {\n  console.log('=== DEBUG: Estrutura completa ===');\n  console.log(JSON.stringify(item.json, null, 2));\n\n  const aggregatedFiles = [];\n  let binaryData = null;\n\n  // Verifica diferentes locais possíveis de arquivos\n  if (item.json.binary && typeof item.json.binary === 'object') {\n    binaryData = item.json.binary;\n  } else if (item.json.files && typeof item.json.files === 'object') {\n    binaryData = item.json.files;\n  } else {\n    for (const key in item.json) {\n      if (key !== 'body' && typeof item.json[key] === 'object' && item.json[key] !== null) {\n        const firstProp = Object.values(item.json[key])[0];\n        if (firstProp && (firstProp.mimeType || firstProp.fileName || firstProp.data)) {\n          binaryData = item.json[key];\n          break;\n        }\n      }\n    }\n  }\n\n  // Se encontrou binários, agrega\n  if (binaryData) {\n    for (const key in binaryData) {\n      const fileOrFiles = binaryData[key];\n      if (Array.isArray(fileOrFiles)) {\n        aggregatedFiles.push(...fileOrFiles);\n      } else if (fileOrFiles && typeof fileOrFiles === 'object') {\n        aggregatedFiles.push(fileOrFiles);\n      }\n    }\n  }\n\n  // Garante que binary exista\n  if (!item.binary) {\n    item.binary = {};\n  }\n\n  // Adiciona arquivos agregados na chave 'comprovantes'\n  item.binary.comprovantes = aggregatedFiles[0] || null;\n\n  // Mantém compatibilidade com outros nós\n  item.json.dados = {\n    body: item.json.body || {},\n    binary: item.binary,\n  };\n\n  results.push(item);\n}\n\nreturn results;\n"
      },
      "id": "ee950a6b-d3a4-4086-a81e-646acd49f226",
      "name": "Agregar Arquivos",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -1632,
        1152
      ]
    },
    {
      "parameters": {
        "functionCode": "const binaryData = $item.json.dados.binary;\nconst relatorioEnderecos = binaryData.relatorio_enderecos;\nconst fotosPontos = binaryData.fotos_pontos;\n\nif (!relatorioEnderecos || !fotosPontos) {\n  throw new Error('Para ME/MO, é obrigatório enviar arquivos nos dois campos.');\n}\nreturn $item;"
      },
      "id": "889c77f6-a4e9-4f54-8555-a069f99c5dbe",
      "name": "Validar Anexos ME MO",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -640,
        1328
      ]
    },
    {
      "parameters": {
        "functionCode": "const binaryData = $item.json.dados.binary;\nconst comprovanteGeral = binaryData.comprovante_geral;\n\nif (!comprovanteGeral) {\n  throw new Error('É obrigatório enviar pelo menos um arquivo no campo de comprovante.');\n}\nreturn $item;"
      },
      "id": "79676f97-6ae6-4807-8bcf-bcdcaa4adce3",
      "name": "Validar Anexo Geral",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -640,
        1488
      ]
    },
    {
      "parameters": {},
      "id": "284a02b7-7d96-4272-8585-9f99471ed27a",
      "name": "Merge",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 2,
      "position": [
        -432,
        1152
      ]
    },
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "CheckingForm",
        "responseMode": "responseNode",
        "options": {}
      },
      "id": "5e0e7219-cfb2-4738-8a77-b931c10eb689",
      "name": "Webhook (Recebe do Front-End)1",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2,
      "position": [
        -2240,
        992
      ],
      "webhookId": "8aa60750-86d1-4587-af9a-a2038f9338a0"
    },
    {
      "parameters": {
        "functionCode": "const body = $json.body || {};\nif (body.action === 'buscar_pi') {\n  return [{ json: { tipo: 'buscar_pi', n_pi: body.n_pi } }];\n} else {\n  return [{ json: { tipo: 'submissao', dados: $item.json } }];\n}"
      },
      "id": "44e64858-1714-4684-9d52-330d3a4b304b",
      "name": "Identificar Ação1",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -2032,
        992
      ]
    },
    {
      "parameters": {
        "documentId": {
          "__rl": true,
          "value": "1iwUay2RE8k1PumivMbEjuzIyw4CBaktJ2YPsR1iwe_Q",
          "mode": "list",
          "cachedResultName": "Checking - Dados PIs Geral - Ult.12 meses",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1iwUay2RE8k1PumivMbEjuzIyw4CBaktJ2YPsR1iwe_Q/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": "gid=0",
          "mode": "list",
          "cachedResultName": "base",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1iwUay2RE8k1PumivMbEjuzIyw4CBaktJ2YPsR1iwe_Q/edit#gid=0"
        },
        "filtersUI": {
          "values": [
            {
              "lookupColumn": "N_PI",
              "lookupValue": "={{$json.n_pi}}"
            }
          ]
        },
        "options": {}
      },
      "id": "c37162cd-6f7f-4398-94eb-546192f3ba91",
      "name": "Buscar PI (dados)1",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [
        -1632,
        848
      ],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "k8IivxJuQMmNVLMa",
          "name": "Google Sheets account"
        }
      }
    },
    {
      "parameters": {
        "functionCode": "// Este nó recebe os dados da planilha do nó anterior\nconst piData = $json;\n\n// Se a busca não retornou um objeto com dados, envia um JSON de erro\nif (!piData || Object.keys(piData).length <= 1) {\n  return [{ \n    json: { \n      error: 'PI não encontrada ou inativa.' \n    } \n  }];\n}\n\n// Se encontrou, retorna um JSON de sucesso com TODOS os campos que o formulário precisa\nreturn [{\n  json: {\n    success: true,\n    cliente: piData.CLIENTE || '',\n    campanha: piData.CAMPANHA || '',\n    produto: piData.PRODUTO || '',\n    periodo: piData.PERIODO || '',\n    veiculo: piData.VEICULO || '', // Campo de texto com a descrição completa\n    meio: piData.MEIO || ''       // Campo de código para o dropdown\n  }\n}];"
      },
      "id": "47f1224d-6e45-45ac-adb2-fc09f4869e34",
      "name": "Montar Resposta PI1",
      "type": "n8n-nodes-base.function",
      "typeVersion": 1,
      "position": [
        -1440,
        848
      ]
    },
    {
      "parameters": {
        "options": {}
      },
      "id": "6441e85b-1fa6-4104-a0f0-a5ac71fa49f6",
      "name": "Responder Dados PI1",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [
        -1232,
        848
      ]
    },
    {
      "parameters": {
        "documentId": {
          "__rl": true,
          "value": "1iwUay2RE8k1PumivMbEjuzIyw4CBaktJ2YPsR1iwe_Q",
          "mode": "list",
          "cachedResultName": "Checking - Dados PIs Geral - Ult.12 meses",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1iwUay2RE8k1PumivMbEjuzIyw4CBaktJ2YPsR1iwe_Q/edit?usp=drivesdk"
        },
        "sheetName": {
          "__rl": true,
          "value": "gid=0",
          "mode": "list",
          "cachedResultName": "base",
          "cachedResultUrl": "https://docs.google.com/spreadsheets/d/1iwUay2RE8k1PumivMbEjuzIyw4CBaktJ2YPsR1iwe_Q/edit#gid=0"
        },
        "filtersUI": {
          "values": [
            {
              "lookupColumn": "N_PI",
              "lookupValue": "={{$json.dados.body.n_pi}}"
            }
          ]
        },
        "options": {}
      },
      "id": "cccff9bc-4f39-4c70-af13-f7868272e78e",
      "name": "Buscar PI (submissao
