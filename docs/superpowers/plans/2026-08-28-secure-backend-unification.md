# Secure Backend Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the existing public UI and business workflow while unifying backend logic, protecting administrative access with single-admin GitHub OAuth, migrating persistence safely, and remediating every validated security and reliability finding.

**Architecture:** Framework-independent CommonJS modules under `server/core/` own validation, use cases, authorization, escaping, persistence interfaces, and error mapping. Existing Vercel Functions and Express routes remain thin adapters until contract tests prove parity; production data migrates from the legacy Gist to Marketplace-provisioned Postgres behind reversible flags.

**Tech Stack:** Node.js 24, CommonJS, built-in `node:test`, Express 4 during transition, Vercel Functions, GitHub OAuth with PKCE, Neon Postgres, Upstash Redis rate limiting, Nodemailer 9, Vercel Preview deployments.

**Spec:** `docs/superpowers/specs/2026-08-28-security-architecture-design.md`

## Global Constraints

- Do not redesign `index.html`, `diagnostico.html`, `styles.css`, or `diagnostico.css`.
- Preserve `/`, `/diagnostico`, `/api/contact`, `/api/diagnostico`, public form fields, Portuguese copy, WhatsApp links, classification behavior, dashboard tables, filters, status labels, detail view, copy action, and logout intent.
- Remove insecure behavior rather than preserving embedded credentials, anonymous admin APIs, anonymous data synchronization, unsafe HTML rendering, or false-success responses.
- Never print, commit, log, or place real credentials or personal records in test fixtures.
- Every production-affecting task requires passing tests, a Preview validation, and an explicit rollback point.
- Do not revoke legacy credentials until replacement credentials have been deployed and read back successfully.

---

## File structure

- `server/core/config.js`: fail-closed environment parsing.
- `server/core/errors.js`: stable application error classes and HTTP mappings.
- `server/core/validation.js`: request schemas, normalization, byte limits, and enum allowlists.
- `server/core/escape.js`: context-specific HTML text escaping used only by email composition.
- `server/core/auth.js`: OAuth state/PKCE, session signing, admin-ID authorization, and CSRF.
- `server/core/repositories.js`: repository interface documentation and runtime guards.
- `server/core/contact-service.js`: contact submission use case.
- `server/core/diagnostic-service.js`: diagnostic submission and classification use case.
- `server/core/mail-service.js`: escaped mail models and delivery outcomes.
- `server/adapters/gist-repository.js`: temporary fail-closed legacy persistence.
- `server/adapters/postgres-repository.js`: target transactional persistence.
- `server/adapters/rate-limit.js`: durable Upstash rate limiter.
- `server/adapters/vercel.js`: request/response adapter helpers.
- `api/auth/*.js`: GitHub login, callback, session, CSRF, and logout functions.
- `api/admin/*.js`: authenticated administrative data APIs.
- `admin.html`, `admin.js`, `admin.css`: discreet admin entry while reusing existing design tokens and dashboard markup.
- `tests/unit/*.test.js`: pure module tests.
- `tests/contract/*.test.js`: adapter parity and HTTP contract tests.
- `tests/security/*.test.js`: authorization, CSRF, XSS, limits, and secret-regression tests.
- `tests/migration/*.test.js`: import, idempotency, digest, and rollback tests.

### Task 1: Establish the non-mutating regression baseline

**Files:**
- Modify: `package.json`
- Create: `tests/helpers/http.js`
- Create: `tests/contract/public-contract.test.js`
- Create: `tests/contract/frontend-contract.test.js`
- Create: `tests/security/no-secrets.test.js`

**Interfaces:**
- Produces: `invokeHandler(handler, request)` returning `{ status, headers, body }` without a network listener.
- Produces: `npm test`, `npm run test:security`, and `npm run check` as stable verification commands.

- [ ] **Step 1: Add built-in Node test scripts without changing runtime dependencies**

```json
{
  "scripts": {
    "start": "node server/server.js",
    "dev": "node server/server.js",
    "test": "node --test tests/**/*.test.js",
    "test:security": "node --test tests/security/*.test.js",
    "check:syntax": "node scripts/check-syntax.js",
    "check": "npm run check:syntax && npm test && npm audit --audit-level=high"
  }
}
```

- [ ] **Step 2: Write characterization tests for existing public routes and form field names**

```js
test('public contract retains contact and diagnostic endpoints', () => {
  assert.match(read('script.js'), /['"]\/api\/contact['"]/);
  assert.match(read('diagnostico.js'), /['"]\/api\/diagnostico['"]/);
});
```

- [ ] **Step 3: Write a secret regression test that initially fails on the known literals**

```js
test('tracked product source contains no credential-shaped fallback', () => {
  for (const file of trackedTextFiles()) {
    assert.doesNotMatch(read(file), /gh[opusr]_[A-Za-z0-9_]{20,}/, file);
    assert.doesNotMatch(read(file), /SMTP_PASS\s*\|\|\s*['"][^'"]+['"]/, file);
  }
});
```

- [ ] **Step 4: Run the baseline and record expected failures without changing production behavior**

Run: `npm test`

Expected: public characterization tests pass; secret-regression test fails on the two confirmed source fallbacks.

- [ ] **Step 5: Commit only the test harness**

```powershell
git add package.json tests scripts/check-syntax.js
git commit -m "test: characterize public and security contracts"
```

### Task 2: Introduce shared validation and error contracts

**Files:**
- Create: `server/core/errors.js`
- Create: `server/core/validation.js`
- Create: `tests/unit/validation.test.js`
- Create: `tests/unit/errors.test.js`

**Interfaces:**
- Produces: `validateContact(input)`, `validateDiagnostic(input)`, `normalizeEmail(value)`, and `toHttpError(error)`.
- Consumes: no framework request objects.

- [ ] **Step 1: Write failing tests for types, UTF-8 byte limits, required consent, email, phone, and diagnostic allowlists**

```js
test('diagnostic requires explicit LGPD consent', () => {
  assert.throws(() => validateDiagnostic({ ...validDiagnostic, consentimento_lgpd: false }),
    error => error.code === 'CONSENT_REQUIRED');
});
```

- [ ] **Step 2: Run the focused test and confirm missing modules fail**

Run: `node --test tests/unit/validation.test.js tests/unit/errors.test.js`

Expected: FAIL with module-not-found for `server/core/validation.js`.

- [ ] **Step 3: Implement strict normalization without changing accepted legitimate form values**

```js
function requireText(value, field, { min = 0, maxBytes }) {
  if (typeof value !== 'string') throw new ValidationError('INVALID_TYPE', field);
  const normalized = value.trim();
  if (normalized.length < min || Buffer.byteLength(normalized, 'utf8') > maxBytes) {
    throw new ValidationError('INVALID_LENGTH', field);
  }
  return normalized;
}
```

- [ ] **Step 4: Run focused and full tests**

Run: `node --test tests/unit/*.test.js` then `npm test`.

Expected: PASS except the intentional secret-regression failure.

- [ ] **Step 5: Commit shared contracts**

```powershell
git add server/core tests/unit
git commit -m "feat: centralize request validation and errors"
```

### Task 3: Create shared use cases and preserve classification behavior

**Files:**
- Create: `server/core/contact-service.js`
- Create: `server/core/diagnostic-service.js`
- Create: `server/core/repositories.js`
- Create: `tests/unit/contact-service.test.js`
- Create: `tests/unit/diagnostic-service.test.js`

**Interfaces:**
- Produces: `createContactService({ repository, mailer, clock, idFactory })`.
- Produces: `createDiagnosticService({ repository, mailer, clock, idFactory })`.
- Repository methods return explicit `{ ok, value }` or throw; they never convert a failed write to success.

- [ ] **Step 1: Write failing use-case tests with in-memory fakes**

```js
test('persistence success and mail failure remain distinct outcomes', async () => {
  const result = await service.submit(validContact);
  assert.equal(result.persisted, true);
  assert.equal(result.mail.sent, false);
});
```

- [ ] **Step 2: Implement minimal framework-independent services**

```js
async function submit(rawInput) {
  const input = validateContact(rawInput);
  const saved = await repository.createLead(toLead(input));
  const mail = await mailer.sendContact(saved);
  return { lead: saved, persisted: true, mail };
}
```

- [ ] **Step 3: Add exact parity cases for every current `calculateLinhaSugerida` branch**

Run: `node --test tests/unit/contact-service.test.js tests/unit/diagnostic-service.test.js`.

Expected: PASS with current Portuguese labels unchanged.

- [ ] **Step 4: Commit the shared use cases**

```powershell
git add server/core tests/unit
git commit -m "feat: unify contact and diagnostic business logic"
```

### Task 4: Harden legacy persistence and remove embedded credentials

**Files:**
- Create: `server/core/config.js`
- Create: `server/adapters/gist-repository.js`
- Modify: `api/lib/db.js`
- Modify: `.env.example`
- Create: `tests/unit/config.test.js`
- Create: `tests/contract/gist-repository.test.js`

**Interfaces:**
- Produces: `loadConfig(env)` with redacted validation errors.
- Produces: `createGistRepository({ token, gistId, request })`.

- [ ] **Step 1: Write failing tests for missing `GITHUB_TOKEN`, non-2xx GitHub responses, malformed JSON, and concurrent-write conflict detection**

```js
test('missing GitHub token fails closed without exposing a value', () => {
  assert.throws(() => loadConfig({}), /GITHUB_TOKEN is required/);
});
```

- [ ] **Step 2: Replace `api/lib/db.js` with a compatibility export backed by the fail-closed adapter**

```js
const repository = createGistRepository({
  token: requireSecret(process.env.GITHUB_TOKEN, 'GITHUB_TOKEN'),
  gistId: requireValue(process.env.GITHUB_GIST_ID, 'GITHUB_GIST_ID'),
  request: githubRequest
});
```

- [ ] **Step 3: Remove all source fallback literals and add only variable names to `.env.example`**

Run: `node --test tests/security/no-secrets.test.js tests/contract/gist-repository.test.js`.

Expected: PASS; no secret value appears in command output.

- [ ] **Step 4: Commit the fail-closed legacy adapter**

```powershell
git add api/lib/db.js server/core/config.js server/adapters/gist-repository.js .env.example tests
git commit -m "fix: remove embedded credentials and fail closed"
```

### Task 5: Implement single-admin GitHub OAuth and secure sessions

**Files:**
- Create: `server/core/auth.js`
- Create: `api/auth/login.js`
- Create: `api/auth/callback.js`
- Create: `api/auth/session.js`
- Create: `api/auth/csrf.js`
- Create: `api/auth/logout.js`
- Create: `tests/security/auth.test.js`

**Interfaces:**
- Produces: `createOAuthChallenge()`, `verifyOAuthCallback()`, `issueSession()`, `verifySession()`, `verifyCsrf()`.
- Consumes: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, `ADMIN_GITHUB_USER_ID`, `SESSION_SECRET`.

- [ ] **Step 1: Write failing tests for state, PKCE S256, exact callback, wrong numeric user ID, tampered/expired cookie, and CSRF mismatch**

```js
test('mutable GitHub login name cannot authorize the wrong numeric user', async () => {
  const result = await callback({ githubUser: { id: 999, login: 'drevencompany' } });
  assert.equal(result.status, 403);
});
```

- [ ] **Step 2: Implement OAuth challenge and callback with no repository/Gist scopes**

```js
const params = new URLSearchParams({
  client_id: config.clientId,
  redirect_uri: config.callbackUrl,
  state,
  code_challenge: challenge,
  code_challenge_method: 'S256',
  allow_signup: 'false'
});
```

- [ ] **Step 3: Implement signed short-lived session and CSRF tokens with `node:crypto`**

Run: `node --test tests/security/auth.test.js`.

Expected: PASS for the sole configured numeric ID and FAIL-CLOSED for all tampering cases.

- [ ] **Step 4: Commit authentication without yet exposing it in production routing**

```powershell
git add server/core/auth.js api/auth tests/security/auth.test.js
git commit -m "feat: add single-admin GitHub authentication"
```

### Task 6: Protect administrative APIs and unify Vercel/Express adapters

**Files:**
- Create: `server/adapters/vercel.js`
- Create: `server/middleware/admin-auth.js`
- Create: `api/admin/leads.js`
- Create: `api/admin/diagnosticos.js`
- Modify: `api/contact.js`
- Modify: `api/diagnostico.js`
- Modify: `api/leads.js`
- Modify: `server/server.js`
- Modify: `server/controllers/contact.js`
- Modify: `server/controllers/briefing.js`
- Create: `tests/contract/adapter-parity.test.js`
- Create: `tests/security/admin-api.test.js`

**Interfaces:**
- Public POST routes use shared services.
- Legacy public GET routes return `401` and deprecation headers before later removal.
- Admin reads/mutations require session; mutations additionally require CSRF.

- [ ] **Step 1: Write the adapter parity matrix before modifying handlers**

```js
for (const adapter of [vercelAdapter, expressAdapter]) {
  test(`${adapter.name} rejects anonymous lead listing`, async () => {
    assert.equal((await adapter.get('/api/admin/leads')).status, 401);
  });
}
```

- [ ] **Step 2: Fix the missing `updateLead` and `deleteLead` imports by routing mutations through the shared repository interface**

- [ ] **Step 3: Make both adapters return the same status codes and response shapes**

Run: `node --test tests/contract/adapter-parity.test.js tests/security/admin-api.test.js`.

Expected: PASS for both adapter families.

- [ ] **Step 4: Commit authenticated parity**

```powershell
git add api server tests
git commit -m "fix: protect admin APIs and align backend adapters"
```

### Task 7: Preserve the dashboard design while removing unsafe client behavior

**Files:**
- Create: `admin.html`
- Create: `admin.js`
- Create: `admin.css`
- Modify: `script.js`
- Modify: `vercel.json`
- Create: `tests/security/admin-rendering.test.js`
- Create: `tests/contract/admin-compatibility.test.js`

**Interfaces:**
- `/admin` uses `/api/auth/session`, `/api/auth/csrf`, and `/api/admin/*`.
- `#admin` redirects to `/admin` during the compatibility window.

- [ ] **Step 1: Write failing source and DOM tests proving untrusted fields never reach `innerHTML`**

```js
test('stored payload is rendered as text', () => {
  const cell = renderTextCell('<img src=x onerror=alert(1)>');
  assert.equal(cell.textContent, '<img src=x onerror=alert(1)>');
  assert.equal(cell.querySelector('img'), null);
});
```

- [ ] **Step 2: Move the existing dashboard markup and styles without visual reinterpretation**

- [ ] **Step 3: Replace dynamic templates with `createElement`, `textContent`, `dataset`, and validated URL setters**

- [ ] **Step 4: Remove the secret contact-form credential and anonymous `syncWithServer()` call**

- [ ] **Step 5: Run compatibility, security, and full tests**

Run: `node --test tests/security/admin-rendering.test.js tests/contract/admin-compatibility.test.js` then `npm test`.

Expected: PASS; public form fields and copy remain unchanged.

- [ ] **Step 6: Commit the secure admin boundary**

```powershell
git add admin.html admin.js admin.css script.js vercel.json tests
git commit -m "fix: secure admin UI without redesign"
```

### Task 8: Centralize and secure email delivery

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `server/core/mail-service.js`
- Modify: `server/templates/admin-alert.html`
- Modify: `server/templates/client-ack.html`
- Modify: `api/contact.js`
- Modify: `api/diagnostico.js`
- Create: `tests/unit/mail-service.test.js`

**Interfaces:**
- Produces: `createMailService({ transport, templates })` with `sendContact()` and `sendDiagnostic()`.
- Mail outcome never changes a committed persistence outcome into a false success or false loss.

- [ ] **Step 1: Write failing escaping and mail-outcome tests for every user-controlled field**

- [ ] **Step 2: Upgrade Nodemailer to the npm-audit recommended supported release in isolation**

Run: `npm install nodemailer@9.0.6 --save-exact`.

- [ ] **Step 3: Consolidate templates and escape HTML text and URL components by context**

- [ ] **Step 4: Run mail tests with a fake transport and `npm audit --audit-level=high`**

Expected: no real SMTP connection; zero high-severity production dependency findings.

- [ ] **Step 5: Commit dependency and mail changes separately from database work**

```powershell
git add package.json package-lock.json server api tests
git commit -m "fix: harden transactional email delivery"
```

### Task 9: Provision target database and durable rate limiting

**Files:**
- Create: `server/adapters/postgres-repository.js`
- Create: `server/adapters/rate-limit.js`
- Create: `db/schema.sql`
- Create: `tests/contract/postgres-repository.test.js`
- Create: `tests/security/rate-limit.test.js`

**Interfaces:**
- Repository implements `createLead`, `createDiagnostic`, `listLeads`, `listDiagnostics`, `updateLead`, `deleteLead`, and `appendAuditEvent`.
- Rate limiter implements `check({ routeClass, clientKey }) -> { allowed, retryAfter }`.

- [ ] **Step 1: Provision Neon and Upstash through Vercel Marketplace only after the external-resource checkpoint is approved**

Run: `vercel integration add neon --yes --no-claim` and `vercel integration add upstash --yes --no-claim`.

Expected: integrations are attached to the linked project or execution pauses for required browser claiming.

- [ ] **Step 2: Pull Development variables into ignored `.env.local` and verify only variable names**

Run: `vercel env pull .env.local --yes`.

- [ ] **Step 3: Write failing isolated repository and limiter tests**

- [ ] **Step 4: Implement parameterized SQL, constraints, pagination, transactions, and privacy-conscious rate-limit keys**

- [ ] **Step 5: Run repository and abuse-control tests against isolated non-production resources**

- [ ] **Step 6: Commit schema and adapters, never generated credentials**

```powershell
git add db server/adapters tests
git commit -m "feat: add transactional storage and durable abuse controls"
```

### Task 10: Migrate legacy data with verification and rollback

**Files:**
- Create: `scripts/migrate-gist-to-postgres.js`
- Create: `scripts/verify-migration.js`
- Create: `tests/migration/gist-to-postgres.test.js`
- Modify: `server/core/config.js`

**Interfaces:**
- `migrate({ source, target, dryRun })` is idempotent and returns counts/digests without PII.
- Flags: `DATA_READ_BACKEND`, `DATA_WRITE_BACKENDS` with explicit accepted values.

- [ ] **Step 1: Write failing tests for dry-run, duplicates, retries, partial failure, digest mismatch, and rollback**

- [ ] **Step 2: Implement transactional import and redacted verification output**

- [ ] **Step 3: Run a dry-run against legacy Production data without writing**

Expected: record counts and validation errors only; no record content in output.

- [ ] **Step 4: Import into isolated target, verify counts and stable digests, then enable time-boxed dual write in Preview**

- [ ] **Step 5: Promote Postgres reads only after verification passes; retain legacy rollback flags**

- [ ] **Step 6: Commit migration tooling before any production cutover**

```powershell
git add scripts server/core/config.js tests/migration
git commit -m "feat: add verified legacy data migration"
```

### Task 11: Add deployment headers and restrict static exposure

**Files:**
- Modify: `vercel.json`
- Modify: `server/server.js`
- Create: `tests/security/headers.test.js`
- Create: `tests/security/static-files.test.js`

**Interfaces:**
- Both deployment modes return equivalent security headers where applicable.
- Express serves only explicit public assets and pages.

- [ ] **Step 1: Write failing tests for CSP, HSTS, nosniff, referrer policy, frame protection, permissions policy, and denied internal paths**

- [ ] **Step 2: Add Vercel headers and begin CSP in report-only mode for Preview if inline-style inventory requires it**

- [ ] **Step 3: Replace `express.static(ROOT_DIR)` with explicit public-file routes/allowlist**

- [ ] **Step 4: Run header and static exposure tests**

Expected: `.env`, `server/data`, source modules, Git metadata, and internal docs are unreachable.

- [ ] **Step 5: Commit deployment hardening**

```powershell
git add vercel.json server/server.js tests/security
git commit -m "fix: harden headers and static file exposure"
```

### Task 12: Preview, rotate credentials, promote, and verify

**Files:**
- Modify: `README.md`
- Create: `docs/operations/deployment-and-rollback.md`
- Create: `docs/operations/secret-rotation.md`

**Interfaces:**
- Operational runbooks contain commands and redacted success criteria, never values.

- [ ] **Step 1: Create a GitHub OAuth app with exact Preview/Production callbacks and wildcard matching disabled**

- [ ] **Step 2: Add GitHub OAuth, session, database, Redis, SMTP, and sole-admin ID variables as Vercel sensitive variables**

- [ ] **Step 3: Deploy a Preview and run full API/browser/security smoke tests**

Run: `vercel deploy` then use `vercel curl` for protected Preview checks.

- [ ] **Step 4: Generate replacement GitHub/SMTP credentials with least privilege; deploy them before revoking exposed credentials**

- [ ] **Step 5: Run `npm run check`, migration verification, Preview smoke tests, and branch review**

Expected: all pass; no anonymous PII response; wrong GitHub account receives 403; valid admin flow succeeds; both public forms persist exactly once.

- [ ] **Step 6: Promote the tested deployment and immediately run read-only production smoke checks**

- [ ] **Step 7: Revoke exposed credentials only after new Production operations succeed**

- [ ] **Step 8: Monitor Vercel, GitHub, SMTP, database, and rate-limit outcomes during the rollback window**

- [ ] **Step 9: Update README claims to match implemented controls and commit runbooks**

```powershell
git add README.md docs/operations
git commit -m "docs: add secure deployment and rollback runbooks"
```

- [ ] **Step 10: Run final verification and record the exact commit/deployment rollback target**

Run: `npm run check`, `git status --short`, `vercel inspect <deployment-url>`.

Expected: tests and audit pass, worktree clean, inspected deployment is the verified build.

