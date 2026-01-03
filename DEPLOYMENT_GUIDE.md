# Guia de Implantação: Next.js em uma VM (Oracle Cloud)

Este guia fornece os passos necessários para implantar e executar esta aplicação Next.js em uma máquina virtual (VM) Linux, como as oferecidas pela Oracle Cloud Infrastructure (OCI).

Seguiremos uma abordagem de produção padrão, usando **PM2** para gerenciar o processo da aplicação e **Nginx** como um proxy reverso para expor a aplicação à internet de forma segura.

---

### Passo 1: Acessar sua VM

Primeiro, conecte-se à sua VM via SSH. Você precisará do endereço IP da VM e da sua chave SSH privada.

```bash
# Substitua os valores pelos seus dados
ssh -i /caminho/para/sua-chave-privada.key usuario@ip-da-vm
```
*   O usuário padrão para VMs Ubuntu na OCI é `ubuntu`. No seu caso, use `nero` se for o seu usuário.

---

### Passo 2: Instalar Node.js e Nginx

Uma vez conectado, atualize os pacotes do sistema e instale as ferramentas necessárias.

```bash
# Atualiza a lista de pacotes
sudo apt update && sudo apt upgrade -y

# Instala o Node.js (versão 20.x, que é a recomendada)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifica a instalação do Node.js e do npm
node -v
npm -v

# Instala o Nginx
sudo apt-get install -y nginx
```

---

### Passo 3: Clonar o Projeto e Instalar Dependências

Agora, vamos baixar o código da sua aplicação para a VM.

**Atenção:** O GitHub não aceita mais senhas pelo terminal. Você deve usar um **Personal Access Token (PAT)**.

#### 3.1. Como gerar um Personal Access Token (PAT) no GitHub:

1.  Acesse o GitHub e faça login na sua conta.
2.  Clique na sua foto de perfil no canto superior direito e vá em **Settings**.
3.  No menu esquerdo, role para baixo e clique em **Developer settings**.
4.  Clique em **Personal access tokens** e depois em **Tokens (classic)**.
5.  Clique no botão **Generate new token** (e depois em **Generate new token (classic)**).
6.  Dê um nome ao seu token (ex: `vm-oci-checking`).
7.  Defina uma data de expiração (recomendado 30 ou 90 dias).
8.  Na seção **Select scopes**, marque a caixa **`repo`**. Isso dará ao token permissão para acessar seus repositórios.
9.  Clique em **Generate token**.
10. **Copie o token imediatamente!** Ele não será mostrado novamente. Guarde-o em um local seguro.

#### 3.2. Clonando o repositório com o Token:

Agora, use os comandos abaixo.

```bash
# Cria o diretório para projetos web (se não existir) e define as permissões
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# Clone o repositório usando o token
# ATENÇÃO: Substitua <SEU_TOKEN> pelo seu token copiado do GitHub
# e <SEU_USUARIO_GITHUB> pelo seu nome de usuário do GitHub.
git clone https://<SEU_USUARIO_GITHUB>:<SEU_TOKEN>@github.com/phillipebarros-dot/Cheking-Opusmultipa.git

# Entre no diretório do projeto
cd Cheking-Opusmultipa

# Instale as dependências do projeto
npm install
```
*   **Exemplo de comando `git clone` preenchido:** `git clone https://github.com/phillipebarros-dot/Cheking-Opusmultipa.git`
*   **Importante:** Ao usar o token na URL, ele pode ficar salvo no histórico do seu terminal. É uma prática segura para servidores, mas esteja ciente.

---

### Passo 4: Fazer o Build da Aplicação

Com as dependências instaladas, crie a versão de produção otimizada do seu site.

```bash
npm run build
```
Este comando cria uma pasta `.next` com a versão otimizada da sua aplicação.

---

### Passo 5: Instalar e Configurar o PM2

PM2 é um gerenciador de processos que manterá sua aplicação online 24/7. Ele reinicia a aplicação automaticamente em caso de falhas ou após a reinicialização da VM.

```bash
# Instala o PM2 globalmente
sudo npm install -g pm2

# Inicia sua aplicação com o PM2
# O nome "checking-app" é um alias para fácil gerenciamento
pm2 start npm --name "checking-app" -- start

# Configura o PM2 para iniciar automaticamente na inicialização do sistema
pm2 startup
```

**Atenção aqui:** O comando `pm2 startup` irá gerar um outro comando que você **precisa copiar e executar**. Ele será parecido com este:

`sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu`

**Copie o comando que apareceu no seu terminal e execute-o.** Não adicione `<` ou `>` nem modifique nada.

```bash
# Execute o comando que foi gerado para você. Exemplo:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Após executar, salve a configuração para que o PM2 lembre dos seus apps
pm2 save
```

Sua aplicação agora está rodando, mas apenas localmente na VM (geralmente na porta 3000). O próximo passo é torná-la acessível pela internet.

---

### Passo 6: Configurar o Nginx como Proxy Reverso

Nginx irá receber as requisições da internet (porta 80) e as redirecionará para a sua aplicação Next.js (porta 3000).

1.  **Crie um arquivo de configuração para o seu site:**

    ```bash
    sudo nano /etc/nginx/sites-available/checking-app
    ```

2.  **Cole o seguinte conteúdo no arquivo.**

    ```nginx
    server {
        listen 80;
        listen [::]:80;

        # Substitua pelo IP da sua VM.
        server_name 144.22.181.161;

        # Aponta para a raiz do domínio (seu IP)
        location / {
            # O script 'npm start' do Next.js roda na porta 3000 por padrão.
            proxy_pass http://localhost:3000; 
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```
    *   **Observação:** O script `dev` do projeto usa a porta 9002, mas o script `start` (que usamos com o PM2) usa a porta padrão do Next.js, que é a **3000**. A configuração acima está correta para produção.

3.  **Salve e feche o arquivo** (em `nano`, use `Ctrl+X`, depois `Y` e `Enter`).

4.  **Ative a configuração e teste o Nginx:**

    ```bash
    # Cria um link simbólico para ativar o site
    sudo ln -s /etc/nginx/sites-available/checking-app /etc/nginx/sites-enabled/

    # Remove o link de configuração padrão se ele existir
    sudo rm /etc/nginx/sites-enabled/default

    # Testa a sintaxe da configuração do Nginx
    sudo nginx -t

    # Se o teste for bem-sucedido ("syntax is ok"), reinicie o Nginx
    sudo systemctl restart nginx
    ```

---

### Passo 7: Liberar a Porta no Firewall

Por fim, certifique-se de que o firewall da sua VM e as regras de segurança da OCI permitem tráfego nas portas 80 (HTTP) e 443 (HTTPS, se for configurar no futuro).

```bash
# Permite tráfego HTTP e HTTPS no firewall local (UFW)
sudo ufw allow 'Nginx Full'
```
Você também precisa verificar o **"Security List"** ou **"Network Security Group"** associado à sua VM no painel da OCI e garantir que há uma regra de entrada (Ingress Rule) para a porta 80 (TCP).

---

### O que fazer após as correções:

Depois de eu aplicar estas mudanças, você precisará fazer o seguinte na sua VM:

1.  **Puxar as atualizações do Git:**
    ```bash
    cd /var/www/Cheking-Opusmultipa
    git pull
    ```

2.  **Reinstalar as dependências e fazer o build novamente:**
    ```bash
    npm install
    npm run build
    ```

3.  **Atualizar o arquivo do Nginx:**
    ```bash
    sudo nano /etc/nginx/sites-available/checking-app 
    # Apague o conteúdo antigo e cole o novo que está no passo 6 atualizado.
    ```

4.  **Reiniciar os serviços:**
    ```bash
    sudo systemctl restart nginx
    pm2 restart checking-app
    ```

Após isso, acesse **diretamente o IP `http://144.22.181.161`** e tudo deve funcionar!

---

### Comandos Úteis do PM2

*   `pm2 list`: Lista todos os processos gerenciados.
*   `pm2 stop checking-app`: Para a sua aplicação.
*   `pm2 start checking-app`: Inicia a sua aplicação.
*   `pm2 restart checking-app`: Reinicia a sua aplicação (útil após uma atualização do código).
*   `pm2 logs checking-app`: Exibe os logs da aplicação em tempo real.
```