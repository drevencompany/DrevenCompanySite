# Guia de Deploy e Rollback Seguro — Dreven Company

## Visão Geral

Este documento descreve o procedimento de deploy e rollback para a infraestrutura unificada da Dreven Company (Vercel Functions + Node.js 24).

---

## 1. Variáveis de Ambiente Necessárias (Vercel Dashboard)

As seguintes variáveis devem ser configuradas como variáveis sensíveis no painel da Vercel:

| Variável | Descrição |
|---|---|
| `GITHUB_TOKEN` | Token do GitHub para persistência no Gist (mínimo privilégio `gist`) |
| `GITHUB_GIST_ID` | ID do Gist onde os leads e diagnósticos são armazenados |
| `GITHUB_OAUTH_CLIENT_ID` | Client ID do GitHub OAuth App |
| `GITHUB_OAUTH_CLIENT_SECRET` | Client Secret do GitHub OAuth App |
| `ADMIN_GITHUB_USER_ID` | ID numérico imutável da conta GitHub do administrador |
| `SESSION_SECRET` | Chave secreta de alta entropia para assinatura HMAC de sessões e CSRF |
| `SMTP_HOST` | Host SMTP do provedor de e-mail (ex: `smtp.hostinger.com`) |
| `SMTP_PORT` | Porta SMTP (ex: `465`) |
| `SMTP_SECURE` | Conexão segura (`true` para porta 465) |
| `SMTP_USER` | Usuário/E-mail de autenticação SMTP |
| `SMTP_PASS` | Senha da conta SMTP |

---

## 2. Processo de Verificação Pré-Deploy

Antes de promover para produção, execute localmente ou no CI:

```powershell
npm run check
```

O comando valida sintaxe, integridade de contratos e ausência de credenciais em código-fonte.

---

## 3. Procedimento de Rollback

Se qualquer anomalia for detectada após o deploy:

1. Acesse o painel da Vercel: **Deployments**.
2. Localize a versão estável anterior verificada.
3. Clique em **Instant Rollback** para reverter o tráfego instantaneamente.
4. Nenhuma perda de dados ocorre pois a persistência é desacoplada da camada de computação.
