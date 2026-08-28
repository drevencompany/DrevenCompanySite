# Dreven Company — Security and Backend Unification Design

## Status and objective

This design defines an incremental remediation of the current Dreven Company site. The public pages, visual design, form fields, confirmation messages, email intent, `/api/contact`, `/api/diagnostico`, and administrative workflow must remain recognizable and compatible while the implementation becomes authenticated, testable, consistent, and recoverable.

No step may claim zero regression risk. Every production change must instead satisfy automated compatibility tests, a Vercel Preview smoke test, explicit rollback criteria, and post-deployment readback.

## Confirmed decisions

- There is exactly one administrator.
- The administrator signs in with the GitHub account currently named `drevencompany`.
- Authorization is bound to the immutable GitHub numeric user ID captured during setup, never to the mutable login name or email alone.
- The discreet entry point is `/admin`; it is not linked in public navigation or the sitemap.
- The old `#admin` entry point temporarily redirects to `/admin` during migration.
- The credential hidden in the public contact form is removed.
- Production remains on Vercel Functions and Node.js 24.
- Express remains temporarily as a local/dedicated adapter until parity tests prove it can be retired safely.
- Shared business logic lives in framework-independent modules consumed by both adapters.

## Target architecture

### Public frontend

`index.html`, `diagnostico.html`, their CSS, and their public copy remain visually stable. Public JavaScript submits the same business fields to the same public URLs. It does not cache the complete lead database or diagnostic database in `localStorage`.

Submission success is shown only after a valid successful API response. Network, validation, persistence, and mail failures have distinct, non-sensitive error handling. The existing WhatsApp fallback remains available.

### Administrative frontend

`/admin` contains the current dashboard experience behind a server-validated session. Visiting `/admin` while signed out shows a GitHub sign-in action. Successful authentication returns to `/admin` and loads protected data. Logout invalidates the server-verifiable session and clears the cookie.

The dashboard creates DOM nodes and assigns untrusted values with `textContent` or validated URL properties. It never interpolates lead or diagnostic content into `innerHTML`. Existing records are treated as untrusted because malicious content may already be stored.

### Authentication

The application implements the GitHub OAuth web application flow with:

- an exact production callback URL;
- wildcard callback matching disabled;
- cryptographically random `state`;
- PKCE using `S256`;
- short-lived, `HttpOnly`, `Secure`, `SameSite=Lax` transient cookies for OAuth state and verifier;
- no requested repository or Gist scopes, because login needs identity only;
- immediate retrieval of the authenticated user's numeric GitHub ID;
- constant comparison with `ADMIN_GITHUB_USER_ID`;
- rejection of every other account with HTTP 403;
- no GitHub access token persisted after identity verification.

The authenticated session is a short-lived signed token stored in an `HttpOnly`, `Secure`, `SameSite=Strict`, path-scoped cookie. The signing key is a Vercel sensitive environment variable. Administrative mutations require a same-origin CSRF token in addition to the session. Login, callback, and protected API routes use restrictive cache headers.

Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps

### Shared backend core

The shared core contains small modules with explicit interfaces:

- configuration validation;
- request schema validation and normalization;
- HTML/text escaping for email templates;
- authentication and authorization;
- CSRF verification;
- persistence repository interfaces;
- contact and diagnostic use cases;
- mail composition and delivery;
- normalized error types and HTTP mappings.

Vercel Functions translate Vercel requests and responses into the shared interfaces. Express routes perform the same translation. Neither adapter owns business validation, authorization rules, persistence decisions, or email HTML.

### Persistence

The target persistence layer is a relational Postgres database provisioned through the Vercel Marketplace, with Neon as the preferred implementation. Tables store leads, diagnostics, migration metadata, and an append-only administrative audit trail. Database constraints enforce required fields, valid statuses, timestamps, and unique identifiers.

The GitHub Gist adapter remains read-compatible only during migration. Migration proceeds as follows:

1. Export and back up the current Gist without printing personal data or credentials.
2. Validate and normalize records into a staging import.
3. Import into Postgres inside a transaction.
4. Compare counts and stable per-record digests.
5. Enable dual write behind a configuration flag for a limited observation period.
6. Read from Postgres and compare sampled results against the legacy source.
7. Promote Postgres as sole writer and reader.
8. Retain a time-boxed rollback path.
9. Revoke the Gist token and remove the legacy adapter only after acceptance.

No record is deleted from the legacy source as part of the initial migration. A separate retention decision governs deletion.

### Rate limiting and abuse controls

Public submissions, OAuth entry points, and administrative APIs receive separate limits. A durable serverless rate-limit store is provisioned through the Vercel Marketplace, with Upstash Redis as the preferred implementation. Limits are keyed with a privacy-conscious hash of the effective client address and route class. Honeypot checks remain defense in depth, not the primary control.

All request bodies and individual fields have explicit type and byte limits. Diagnostic enum-like answers use allowlists. Email recipients are derived only from validated addresses. Mail attempts are bounded and failures are observable without logging personal content.

### Email

Nodemailer is upgraded in isolation to a non-vulnerable supported release. Email templates are centralized and tested as text/HTML outputs. User content is escaped for its precise HTML or URL context. SMTP configuration has no source-code fallback and is validated at startup or invocation.

An unavailable SMTP service must not silently claim that notification email was sent. The persistence result and mail result are represented separately so that an accepted lead is not lost merely because mail delivery failed.

### Security headers and static files

Vercel configuration adds CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame protection, and a minimal `Permissions-Policy`. CSP rollout begins in report-only mode on Preview if current inline styles require it, followed by enforcement after violations are resolved.

Express serves an explicit public-file allowlist rather than the repository root. It must never expose `.env`, source modules, `server/data`, Git metadata, configuration files, or internal documentation.

### Error behavior and observability

API errors use stable codes and correct HTTP statuses. Persistence failures are never converted into success. Logs include request IDs, route, error class, and operational outcome but exclude secrets, full emails, phone numbers, diagnostic prose, tokens, cookies, and request bodies.

Health checks verify process availability only. Dependency readiness is exposed separately and protected when it would reveal infrastructure state.

## Compatibility contract

The remediation preserves:

- public URLs `/`, `/diagnostico`, `/api/contact`, and `/api/diagnostico`;
- current form fields and Portuguese user-facing copy unless an error message is misleading;
- WhatsApp links and contact destination;
- lead and diagnostic classification behavior;
- administrative table, filters, detail view, status labels, copy action, and logout intent;
- administrative access through `#admin` during the migration window;
- both Vercel and Express adapters until parity is proven.

The following insecure behaviors are intentionally not preserved:

- embedded credentials;
- unauthenticated administrative APIs;
- login by secret values in the contact form;
- downloading all customer data for anonymous visitors;
- persisting the full customer database in browser storage;
- rendering stored input as HTML;
- returning success after failed persistence;
- unrestricted record mutation.

## Testing and verification

The implementation begins with characterization tests for the current public contracts. Required suites include:

- unit tests for normalization, validation, classification, escaping, cookies, PKCE, sessions, CSRF, and error mapping;
- contract tests executed against both Vercel and Express adapters;
- repository tests for legacy Gist and Postgres implementations using fakes or isolated test resources;
- migration tests for idempotency, duplicate handling, rollback, and digest comparison;
- authorization tests covering anonymous, wrong GitHub account, expired session, tampered session, missing CSRF, and valid administrator;
- stored-XSS regression tests for every displayed and emailed field;
- rate-limit and maximum-body tests;
- mail composition tests with no real outbound messages;
- browser smoke tests for the public form, diagnosis flow, GitHub-login boundary, dashboard, and logout;
- `npm audit`, syntax checks, lint, and dependency-tree validation;
- Vercel Preview deployment and read-only production smoke checks before promotion.

Production promotion requires all automated tests passing, no unreviewed security regression, successful migration verification, a documented rollback target, and explicit approval at the deployment checkpoint.

## Secret rotation sequence

Rotation follows zero-downtime ordering:

1. Create replacement credentials with minimum privileges.
2. Store replacements as Vercel sensitive environment variables for Preview.
3. Deploy and validate Preview.
4. Add replacements to Production and redeploy.
5. Verify authenticated operations and logs.
6. Revoke exposed GitHub and SMTP credentials.
7. Confirm the application fails closed when secrets are missing.
8. Remove literals from source and address Git history exposure.

Reference: https://vercel.com/docs/environment-variables/rotating-secrets

## Rollout and rollback

Work is split into independently reviewable increments. No increment mixes credential rotation, database cutover, authentication, dependency major upgrade, and visual refactoring. Each increment has a Preview deployment and a rollback commit or configuration flag.

Database cutover, OAuth activation, secret revocation, and production promotion are explicit external-state checkpoints. They are never inferred from a passing local test.

## Out of scope

- Multi-user administration, roles, organizations, and self-service registration.
- Visual redesign of the public site.
- New CRM functionality unrelated to the existing dashboard.
- Destructive deletion of existing customer data without a separate retention decision.
- Production deployment without an approved Preview and rollback checkpoint.

