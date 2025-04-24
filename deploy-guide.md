
# Guia de Deploy do Bitcoin DCA Pro

Este guia explica como fazer o deploy do Bitcoin DCA Pro em uma VPS da Hetzner usando Docker e Portainer.

## Pré-requisitos

- Docker e Docker Compose instalados na sua VPS
- Portainer instalado (opcional, mas recomendado para gerenciamento)
- Domínio apontando para o IP da sua VPS
- Firewall configurado para permitir apenas conexões nas portas 80 e 443

## Configuração

1. Clone o repositório na sua VPS:

```bash
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_REPOSITORIO]
```

2. Crie o arquivo `.env` baseado no exemplo:

```bash
cp .env.example .env
```

3. Edite o arquivo `.env` com suas configurações:

```bash
nano .env
```

4. Atualize o `Caddyfile` com seu domínio:

```bash
nano Caddyfile
```
Substitua `example.com` pelo seu domínio e `seu-email@example.com` pelo seu email.

## Deploy com Caddy (Recomendado)

1. Inicie os serviços:

```bash
docker-compose up -d
```

2. Verifique se os contêineres estão em execução:

```bash
docker-compose ps
```

## Deploy com Nginx (Alternativo)

Se preferir usar Nginx:

1. Crie os diretórios para os certificados SSL:

```bash
mkdir -p ssl/live/seu-dominio.com
```

2. Obtenha certificados SSL (com Certbot, por exemplo) e coloque-os na pasta `ssl/live/seu-dominio.com/`.

3. Atualize o arquivo `nginx.conf` com seu domínio:

```bash
nano nginx.conf
```

4. Inicie os serviços usando o arquivo docker-compose.nginx.yml:

```bash
docker-compose -f docker-compose.nginx.yml up -d
```

## Gerenciamento com Portainer

1. Acesse o Portainer na sua VPS (normalmente em `https://seu-ip:9000`).
2. Vá para "Stacks" e clique em "Add stack".
3. Cole o conteúdo do arquivo docker-compose.yml (ou docker-compose.nginx.yml).
4. Configure as variáveis de ambiente.
5. Clique em "Deploy the stack".

## Segurança

Esta configuração expõe apenas as portas 80 e 443 para a internet, conforme solicitado:

- Porta 80: HTTP (redirecionado para HTTPS)
- Porta 443: HTTPS (conexão segura)

O aplicativo em si (porta 3000) não é exposto diretamente, apenas através do proxy reverso.

## Manutenção

Para atualizar o aplicativo:

```bash
git pull
docker-compose build
docker-compose up -d
```

Para verificar logs:

```bash
docker-compose logs -f
```

Para parar os serviços:

```bash
docker-compose down
```
