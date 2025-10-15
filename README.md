# Formulário de Checking - OpusMúltipla

![Status do Projeto](https://img.shields.io/badge/status-ativo-brightgreen)
![n8n](https://img.shields.io/badge/n8n-1.110.1%2B-blueviolet)
![Google Sheets](https://img.shields.io/badge/Google-Sheets-green)
![Google Drive](https://img.shields.io/badge/Google-Drive-yellow)

Sistema automatizado para submissão e gerenciamento de checkings de Propostas de Inserção (PIs) da OpusMúltipla, integrando interface web inteligente com workflow de automação robusto em n8n.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Arquitetura](#-arquitetura)
- [Como Usar](#-como-usar)
- [Configuração Técnica](#-configuração-técnica)
- [Desenvolvimento](#-desenvolvimento)
- [Domínio Personalizado](#-domínio-personalizado)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

O projeto automatiza completamente o processo de "Checking" de Propostas de Inserção (PIs), substituindo o fluxo manual de e-mails e validações por um sistema centralizado que garante:

- ✅ **Integridade dos dados** através de validação híbrida (front-end + back-end)
- 📁 **Organização automática** de arquivos no Google Drive
- 🔔 **Notificações em tempo real** para equipes responsáveis
- 📊 **Rastreabilidade completa** com logs auditáveis
- ⚡ **Eficiência operacional** com redução significativa de erros

## ✨ Funcionalidades

### 🔄 Auto-preenchimento Inteligente
- Busca automática de dados da PI no Google Sheets
- Preenchimento instantâneo de: Cliente, Campanha, Produto, Período, Veículo e Meio
- Redução de digitação manual e prevenção de erros

### ✅ Validação Híbrida

**Front-end (Feedback Imediato):**
- Validação de campos obrigatórios antes do envio
- Verificação de anexos por tipo de meio
- Validação de tamanho de arquivos (limite 500MB)
- Feedback visual instantâneo

**Back-end (Segurança):**
- Revalidação da existência e status da PI
- Verificação de quantidade mínima de arquivos
- Validação de integridade dos dados
- Proteção contra manipulação de requisições

### 📂 Organização Automática
- Criação automática de estrutura de pastas no Google Drive
- Nomenclatura padronizada: `PI_{NUMERO} - {CLIENTE} - {DATA}`
- Hierarquia: `Checkings > Cliente > PI específica`
- Links diretos para acesso rápido

### 📧 Notificações Automáticas
- E-mail HTML profissional com todos os detalhes
- Enviado imediatamente após validação
- Contém link direto para pasta no Drive
- Template responsivo e moderno

### 📊 Registro e Auditoria
- Log completo em aba dedicada do Google Sheets
- Registro de: Data/Hora, PI, Cliente, Veículo, Quantidade de arquivos
- Histórico completo de todas as submissões
- Facilita auditorias e rastreamento

### 🎨 Interface Amigável
- Design moderno e profissional
- Barra de progresso visual durante upload
- Mensagens de status claras e informativas
- Contador de arquivos em tempo real
- Responsivo para mobile e desktop

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **HTML5, CSS3, JavaScript** | Interface do usuário |
| **Google Fonts (Inter)** | Tipografia moderna |
| **n8n (Self-Hosted)** | Orquestração e automação |
| **Google Sheets API** | Fonte de dados e registro de logs |
| **Google Drive API** | Armazenamento de arquivos |
| **GitHub Pages** | Hospedagem do formulário |
| **Docker + Traefik** | Infraestrutura n8n |

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Pages                              │
│              (formschecking.grupoom.com.br)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         index.html (Formulário Web)                │    │
│  │  • Validação front-end                             │    │
│  │  • Busca automática de PI                          │    │
│  │  • Upload com barra de progresso                   │    │
│  └────────────────┬───────────────────────────────────┘    │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    │ HTTPS POST
                    │ (CORS habilitado)
                    ▼
┌─────────────────────────────────────────────────────────────┐
│              n8n Workflow (n8n.grupoom.com.br)              │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. Webhook Receiver                               │    │
│  │     ├─ Busca PI (action: "buscar_pi")              │    │
│  │     └─ Submissão (action: "submissao_form")        │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  2. Validação e Processamento                      │    │
│  │     ├─ Validar campos obrigatórios                 │    │
│  │     ├─ Verificar status da PI                      │    │
│  │     ├─ Validar arquivos por meio                   │    │
│  │     └─ Preparar dados para upload                  │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  3. Organização no Drive                           │    │
│  │     ├─ Buscar/Criar pasta Cliente                  │    │
│  │     ├─ Criar pasta da PI                           │    │
│  │     └─ Upload de arquivos                          │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  4. Registro e Notificação                         │    │
│  │     ├─ Registrar log no Sheets                     │    │
│  │     ├─ Enviar e-mail de notificação                │    │
│  │     └─ Responder sucesso ao front-end              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google Workspace                            │
│                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   Google Sheets      │  │   Google Drive       │        │
│  │  • Base de PIs       │  │  • Pasta Checkings   │        │
│  │  • Log de envios     │  │  • Pastas por Cliente│        │
│  └──────────────────────┘  │  • Arquivos da PI    │        │
│                             └──────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 Como Usar

### Acesso ao Formulário
1. Acesse: **[https://formschecking.grupoom.com.br](https://formschecking.grupoom.com.br)**
2. Digite o número da PI no campo específico
3. Aguarde o preenchimento automático dos dados
4. Preencha seus dados de contato (Nome, E-mail, Telefone)
5. Adicione observações, se necessário
6. Anexe os arquivos de comprovação conforme o meio especificado
7. Clique em "Enviar Checking"
8. Aguarde a confirmação de sucesso

### Tipos de Comprovantes por Meio

| Meio | Comprovantes Necessários |
|------|--------------------------|
| **DO** (Digital Out of Home) | • Relatório Fotográfico<br>• Relatório de Exibições<br>• Vídeo Diurno |
| **ME** (Mídia Externa) | • Relatório com Endereços<br>• Fotos Diurnas/Noturnas |
| **MO** (Metrô) | • Listagem Estações/Linhas<br>• Fotos/Vídeos |
| **BD** (Busdoor) | • Relatório Fotográfico dos Ônibus |
| **OD/FL** (Outdoor/Frontlight) | • Relatório Fotográfico com Endereço |
| **MI** (Mídia Interna) | • Relatório Fotográfico e Locais |
| **Outros** | • Relatório/Comprovante Geral |

## ⚙️ Configuração Técnica

### Requisitos de Infraestrutura

#### Servidor n8n
- **Sistema Operacional:** Linux (Ubuntu 20.04+ recomendado)
- **Docker:** 20.10+
- **Docker Compose:** 2.0+
- **Memória RAM:** Mínimo 4GB (8GB recomendado)
- **Disco:** 20GB+ disponível
- **Certificado SSL:** Let's Encrypt via Traefik

#### APIs Necessárias
1. **Google Sheets API**
   - Acesso à planilha de PIs
   - Permissões de leitura e escrita

2. **Google Drive API**
   - Acesso à pasta raiz de Checkings
   - Permissões para criar pastas e fazer upload

3. **SMTP** (Gmail recomendado)
   - Conta de serviço para envio de e-mails
   - Senha de aplicativo configurada

### Configuração CORS (Essencial)

Para permitir que o formulário hospedado no GitHub Pages se comunique com o n8n, configure as variáveis de ambiente:

```bash
# No arquivo .env ou docker-compose.yml
N8N_CORS_ALLOWED_ORIGINS=https://formschecking.grupoom.com.br
N8N_CORS_ALLOWED_METHODS=GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS
N8N_CORS_ALLOWED_HEADERS=Origin,X-Requested-With,Content-Type,Accept,Authorization,X-N8N-API-KEY
```

**⚠️ Importante:** Reinicie o n8n após alterar essas variáveis.

### Limites e Timeouts

```yaml
# Configurações recomendadas no docker-compose.yml
environment:
  - N8N_PAYLOAD_SIZE_MAX=800              # 800MB
  - N8N_FORMDATA_FILE_SIZE_MAX=800        # 800MB
  - N8N_WEBHOOK_TIMEOUT=3600000           # 60 minutos
  - N8N_EXECUTIONS_TIMEOUT=7200           # 2 horas
  - N8N_EXECUTIONS_TIMEOUT_MAX=10800      # 3 horas
  - NODE_OPTIONS=--max-old-space-size=4096 # 4GB heap
```

### Estrutura do Google Sheets

#### Aba Principal (PIs)
| Coluna | Descrição | Tipo |
|--------|-----------|------|
| N_PI | Número da PI | Texto |
| CLIENTE | Nome do cliente | Texto |
| CAMPANHA | Nome da campanha | Texto |
| PRODUTO | Produto anunciado | Texto |
| PERIODO | Período de veiculação | Texto |
| VEICULO | Veículo de mídia | Texto |
| MEIO | Código do meio (AT, BD, CI, etc.) | Texto |
| STATUS | Status da PI (ativa/inativa) | Texto |

#### Aba Log_Checkings
| Coluna | Descrição | Tipo |
|--------|-----------|------|
| PI | Número da PI | Texto |
| Veículo | Veículo de mídia | Texto |
| Cliente | Nome do cliente | Texto |
| Data | Data/hora do envio | Data/Hora |
| Qtd_Arquivos | Quantidade de arquivos | Número |
| Status | Status do envio | Texto |

## 👨‍💻 Desenvolvimento

### Estrutura do Projeto

```
formulario-checking/
├── index.html                 # Formulário principal
├── logo-opus.png             # Logo OpusMúltipla
├── comunicado.jpg            # Imagem de aviso
├── favicon.png               # Ícone do site
├── README.md                 # Este arquivo
├── WORKFLOW.md               # Documentação técnica do n8n
└── docker-compose.yml        # Configuração da infraestrutura
```

### Comunicação Front-end ↔ n8n

O formulário se comunica com o webhook n8n através de duas ações:

#### 1. Busca de PI (Auto-preenchimento)
```javascript
// Requisição
POST https://n8n.grupoom.com.br/webhook/CheckingForm
Content-Type: application/json

{
  "action": "buscar_pi",
  "n_pi": "182429"
}

// Resposta de Sucesso
{
  "success": true,
  "cliente": "NOME DO CLIENTE",
  "campanha": "NOME DA CAMPANHA",
  "produto": "PRODUTO",
  "periodo": "01/01/2025 - 31/01/2025",
  "veiculo": "VEÍCULO",
  "meio": "DO"
}

// Resposta de Erro
{
  "success": false,
  "error": "PI não encontrada"
}
```

#### 2. Submissão do Formulário
```javascript
// Requisição
POST https://n8n.grupoom.com.br/webhook/CheckingForm
Content-Type: multipart/form-data

FormData {
  action: "submissao_form",
  nome: "João Silva",
  email: "joao@example.com",
  telefone: "(11) 98765-4321",
  n_pi: "182429",
  cliente: "CLIENTE",
  campanha: "CAMPANHA",
  produto: "PRODUTO",
  periodo: "01/01/2025 - 31/01/2025",
  veiculo: "VEICULO",
  meio: "DO",
  observacoes: "Observações...",
  upload_method: "binary",
  relatorio_fotografico_do: [File],
  relatorio_exibicoes_do: [File],
  video_diurno_do: [File]
}

// Resposta de Sucesso
{
  "success": true,
  "message": "Checking enviado com sucesso!"
}

// Resposta de Erro
{
  "success": false,
  "message": "Descrição do erro"
}
```

### Testando Localmente

#### 1. Clone o Repositório
```bash
git clone https://github.com/phillipebarros-dot/Formulario-Cheking.git
cd Formulario-Cheking
```

#### 2. Teste com Servidor Local
```bash
# Python 3
python -m http.server 8000

# Ou Node.js (http-server)
npx http-server -p 8000
```

#### 3. Acesse
```
http://localhost:8000
```

### Depuração

#### Front-end (Console do Navegador)
```javascript
// Verificar dados antes do envio
console.log('FormData:', Object.fromEntries(formData));

// Monitorar progresso do upload
xhr.upload.addEventListener('progress', (e) => {
  console.log(`Progresso: ${(e.loaded / e.total * 100).toFixed(2)}%`);
});
```

#### Back-end (n8n)
1. Acesse o workflow no n8n
2. Ative "Save manual executions"
3. Execute manualmente com dados de teste
4. Analise cada nó clicando nele
5. Verifique logs em "Executions"

### Testes com Dados de Teste

Para evitar criar pastas reais durante testes:

**Opção 1: Desativar Nós de Produção**
- No n8n, desative temporariamente:
  - "Criar Pasta Cliente"
  - "Criar Pasta PI"
  - "Upload Arquivo no Drive"
  - "Enviar E-mail Notificação"

**Opção 2: PI de Teste**
- Crie uma PI específica: `TESTE-999`
- Adicione um nó IF antes das operações:
```javascript
if ($json.body.n_pi.startsWith('TESTE-')) {
  return false; // Para a execução
}
return true;
```

## 🌍 Domínio Personalizado

### Configuração no GitHub Pages

1. **Adicionar Arquivo CNAME**
```bash
echo "formschecking.grupoom.com.br" > CNAME
git add CNAME
git commit -m "Add custom domain"
git push
```

2. **Configurar DNS**
```
Tipo: CNAME
Nome: formschecking
Destino: phillipebarros-dot.github.io.
TTL: 3600
```

3. **Configurar no GitHub**
- Vá em: Settings > Pages
- Em "Custom domain", digite: `formschecking.grupoom.com.br`
- Marque "Enforce HTTPS"

4. **Atualizar CORS no n8n**
```bash
N8N_CORS_ALLOWED_ORIGINS=https://formschecking.grupoom.com.br
```

### Verificação

```bash
# Verificar DNS
nslookup formschecking.grupoom.com.br

# Testar conectividade
curl -I https://formschecking.grupoom.com.br

# Testar CORS
curl -X OPTIONS https://n8n.grupoom.com.br/webhook/CheckingForm \
  -H "Origin: https://formschecking.grupoom.com.br" \
  -H "Access-Control-Request-Method: POST"
```

## 🔧 Troubleshooting

### Erro de CORS

**Sintoma:** Console mostra erro "CORS policy"

**Solução:**
1. Verifique variáveis de ambiente do n8n
2. Confirme que o domínio está correto
3. Reinicie o container n8n
4. Limpe cache do navegador

### PI Não Encontrada

**Sintoma:** Mensagem "PI não encontrada ou inválida"

**Verificações:**
1. ✅ PI existe na planilha?
2. ✅ Coluna `N_PI` tem o valor correto?
3. ✅ Planilha está acessível pelo n8n?
4. ✅ Credenciais do Google Sheets estão válidas?

### Upload Falha

**Sintoma:** "Erro ao enviar arquivos"

**Verificações:**
1. ✅ Tamanho total < 500MB?
2. ✅ Timeout configurado corretamente?
3. ✅ Pasta raiz do Drive existe?
4. ✅ Permissões do Google Drive OK?
5. ✅ Espaço disponível no Drive?

### E-mail Não Enviado

**Sintoma:** Formulário sucesso, mas sem e-mail

**Verificações:**
1. ✅ Credenciais SMTP corretas?
2. ✅ Porta 465 liberada no firewall?
3. ✅ Senha de aplicativo válida?
4. ✅ E-mail destino correto?
5. ✅ Verificar logs do n8n

### Campos Não Preenchem

**Sintoma:** Dados da PI não aparecem

**Verificações:**
1. ✅ Estrutura da planilha correta?
2. ✅ Nomes das colunas exatos (case-sensitive)?
3. ✅ Webhook respondendo?
4. ✅ Console do navegador mostra erros?

## 📞 Suporte

Para dúvidas ou problemas:

1. **Documentação Técnica:** Consulte [WORKFLOW.md](./WORKFLOW.md)
2. **Issues:** Abra uma issue neste repositório
3. **E-mail:** phillipe.barros@grupoom.com.br

## 📝 Changelog

### v1.0.0 (2025-01-15)
- ✨ Lançamento inicial
- ✅ Auto-preenchimento de PIs
- ✅ Validação híbrida
- ✅ Upload automático para Drive
- ✅ Sistema de notificações
- ✅ Logs auditáveis

## 📄 Licença

© 2025 OpusMúltipla - Todos os direitos reservados.

---

**Desenvolvido por:** Grupo OM - Comunicação Integrada
