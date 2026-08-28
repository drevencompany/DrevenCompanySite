# Procedimento de Rotação de Segredos — Dreven Company

## Diretrizes de Segurança

- **Princípio do menor privilégio:** nunca atribua permissões extras a tokens de acesso.
- **Transição segura:** novos segredos devem ser configurados e testados antes da revogação dos antigos.
- **Zero exposição:** segredos jamais devem ser registrados em logs, repositórios ou mensagens de erro.

---

## 1. Rotação do Token GitHub (Gist Persistence)

1. Acesse o GitHub: **Settings > Developer Settings > Personal Access Tokens (classic)**.
2. Gere um novo token com escopo estrito apenas para `gist`.
3. Atualize a variável `GITHUB_TOKEN` no painel da Vercel.
4. Execute uma requisição de teste para confirmar gravação bem-sucedida.
5. Revogue o token antigo no painel do GitHub.

---

## 2. Rotação do Segredo de Sessão (`SESSION_SECRET`)

1. Gere uma nova string de 64 caracteres criptograficamente segura:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Atualize `SESSION_SECRET` na Vercel e efetue o redeploy.
3. Sessões ativas anteriores serão invalidadas de forma limpa, exigindo novo login único via GitHub OAuth.

---

## 3. Rotação de Credenciais SMTP

1. Altere a senha da caixa postal corporativa no painel da Hostinger / provedor de e-mail.
2. Atualize `SMTP_PASS` nas configurações da Vercel.
3. Teste o disparo preenchendo o formulário de contato.
