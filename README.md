# Dreven Company — Official Digital Experience & Core Engine

> **Holding de Estratégia, Engenharia de Produto e Inteligência Artificial Aplicada**  
> Curitiba, Paraná — Brasil | [dreven.company](https://dreven.company)

---

## 🏛️ Visão Geral da Arquitetura

Este repositório contém a infraestrutura e a experiência web oficial da **Dreven Company**, projetada sob princípios de engenharia de software de alta precisão, performance extrema e segurança de nível corporativo.

A arquitetura combina uma interface estática ultra-otimizada (zero dependências pesadas de runtime, carregamento sub-segundo) com um motor híbrido de backend compatível com **Node.js / Express** para ambientes dedicados e **Serverless Functions** na **Vercel** para alta disponibilidade global.

```
DREVEN COMPANY/
├── api/
│   └── contact.js             # Serverless Function para processamento e envio na Vercel
├── assets/
│   ├── email-banner.png       # Banner oficial para e-mails transacionais
│   ├── monogram.png           # Símbolo vetorial oficial da marca
│   └── photos/                # Imagens em formato WebP de alta fidelidade
├── docs/
│   └── brand/                 # Documentos institucionais e diretrizes da marca
├── server/
│   ├── server.js              # Servidor Express dedicado com rate limit e static serving
│   ├── controllers/
│   │   └── contact.js         # Validação de payload, honeypot e orquestração
│   ├── services/
│   │   ├── mailer.js          # Disparo de e-mails transacionais (Nodemailer / SMTP)
│   │   └── storage.js         # Persistência segura e local de leads
│   └── templates/
│       ├── admin-alert.html   # Template de notificação interna (contato@dreven.company)
│       └── client-ack.html    # Template executivo de confirmação para o cliente
├── index.html                 # Interface semântica HTML5 com arquitetura de 10 seções
├── styles.css                 # Design System monocromático de 5 tons e física Apple/Linear
├── script.js                  # Engine client-side: observers, micro-interações e formulário
├── vercel.json                # Configuração de rotas, clean URLs e cabeçalhos OWASP
├── package.json               # Manifest e scripts de gerenciamento do projeto
├── .env.example               # Template de variáveis de ambiente sem segredos
└── .gitignore                 # Protocolo de blindagem contra vazamento de credenciais
```

---

## 🎨 Design System & Engenharia Visual

* **Paleta Monocromática Estrita (5 Tons Oficiais)**:
  * `White Smoke` (`#F4F2F3`) — Fundo primário e superfície limpa.
  * `Platinum` (`#E1E1E1`) — Delimitações e superfícies secundárias.
  * `Silver` (`#B0B0B0`) — Tipografia de suporte e números de índice.
  * `Dim Gray` (`#656565`) — Tipografia secundária e rótulos de precisão.
  * `Black` (`#090809`) — Tinta principal, contraste e autoridade.
* **Tipografia**: Google Fonts `Poppins` e `Archivo`.
* **Física e Micro-interações**: Curva cúbica Apple `cubic-bezier(0.16, 1, 0.3, 1)` para transições suaves, *Frosted Glass* com `backdrop-filter` e efeitos perolados via máscaras CSS.

---

## 🔒 Protocolos de Cibersegurança & Conformidade

1. **Zero Secret Leaks**:
   * O repositório segue a política estrita de segredos externos. Nenhuma senha, token ou chave privada reside no código-fonte.
   * Arquivos de ambiente (`.env`, `.env.*`) e bases de dados de leads (`server/data/`) são permanentemente ignorados pelo Git.
2. **Cabeçalhos HTTP Defensivos (OWASP / NIST)**:
   * `X-Content-Type-Options: nosniff`
   * `X-Frame-Options: DENY` (anti-Clickjacking)
   * `X-XSS-Protection: 1; mode=block`
   * `Referrer-Policy: strict-origin-when-cross-origin`
   * `Permissions-Policy: camera=(), microphone=(), geolocation=()`
   * `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
3. **Mecanismos Anti-Spam e Anti-DoS**:
   * Campo *Honeypot* invisível contra crawlers e bots maliciosos.
   * Rate limiting por endereço IP.
   * Sanitização rigorosa de caracteres de entrada para prevenção de injeção.

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
* Node.js v18.0.0+
* NPM v9.0.0+

### Passo a Passo
```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações locais

# 3. Iniciar o servidor de desenvolvimento
npm start
```
A aplicação estará disponível em `http://localhost:3000`.

---

## 🚀 Implantação em Produção (Vercel)

1. Conecte o repositório à **Vercel**.
2. Configure as seguintes **Environment Variables** no painel do projeto:
   * `SMTP_HOST`: Servidor SMTP (ex: `smtp.hostinger.com`)
   * `SMTP_PORT`: Porta segura (ex: `465`)
   * `SMTP_SECURE`: `true`
   * `SMTP_USER`: `contato@dreven.company`
   * `SMTP_PASS`: Senha da caixa postal
   * `SMTP_FROM`: `"Dreven Company" <contato@dreven.company>`
   * `CONTACT_RECEIVER_EMAIL`: `contato@dreven.company`
3. Execute o deploy e vincule o domínio customizado `dreven.company`.

---

## 📄 Licença & Propriedade

Copyright &copy; 2026 **Dreven Company**. Todos os direitos reservados.  
Estratégia, Engenharia de Produto e Inteligência Artificial Aplicada.
