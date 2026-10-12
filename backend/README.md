# Backend for Clearky

To run the full app from the project root, install dependencies, configure
`backend/.env` as described below, then run:

```bash
npm install
npm run dev
```

This starts both the Vite frontend and the backend API. Frontend API requests
are proxied to the backend during development.

Run locally:

```bash
cd backend
npm install
copy .env.example .env
# Set your SMTP values in .env before sending signup confirmation emails.
npm run seed
npm run dev
```

Locally, student accounts are stored in `backend/data.sqlite`. For deployments,
the backend uses Turso/libSQL when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
are set. Vercel requires this hosted database because its function filesystem is
ephemeral; without these settings the API returns an error instead of saving
accounts that will disappear. Passwords are hashed on the server, and accounts,
sessions, requests, verification codes, and uploaded documents are stored in
the configured database.

The student document library is available at `/documents` and only exposes
documents tied to the signed-in student's account. Final document release and
approval email delivery are intentionally disabled on Vercel until
University-approved SSO is integrated and reviewer authorization can be
verified server-side. Local preview notifications do not issue official records
or include official transcript or clearance files.

### Deploying to Vercel

1. Create a Turso database and an authentication token using the Turso CLI or
   dashboard. Configure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the
   Vercel project's **Settings → Environment Variables** for every environment
   where the app should work.
2. Add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` as
   Vercel environment variables. These are required for email-confirmed signup.
   Keep all credentials server-side; do not use the `VITE_` prefix for secrets.
3. Import the repository into Vercel with the repository root as the project
   root. Use `npm run build` as the build command and `dist` as the output
   directory. The `/api/*` serverless function is included in this repository,
   so the frontend can use the same deployment without setting `VITE_API_URL`.
4. Redeploy after setting the environment variables. Check
   `https://<your-deployment>/api/health` for `{"ok":true}`, then test signup and
   sign-in on the deployed domain.

The first API request initializes the schema in Turso. Local accounts in
`backend/data.sqlite` are not copied automatically. To preserve existing local
accounts and portal data, set the Turso credentials in `backend/.env` and run
the one-time importer from the project root before switching the live
deployment:

```bash
npm run migrate:turso --prefix backend
```

It copies records that do not already exist in Turso and includes account
password hashes, active sessions, requests, and uploaded documents. Keep the
SQLite file and Turso backups until you have verified the migrated accounts.
Otherwise, users of a previous local or ephemeral deployment must sign up again.

Signup email verification requires an SMTP provider. Configure `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM` in `backend/.env` locally or as Vercel
environment variables in production. Use an app password or
provider-issued credential where required; do not commit real credentials. Confirmation
codes expire after 15 minutes and can be requested again after one minute. After the
verification step, signup creates the account and returns the student to the sign-in page. The final
reviewer can send a preview approval notification locally. Vercel blocks final
approval email delivery until University-approved reviewer SSO is integrated;
SMTP configuration alone does not authorize release of official student records.

## University of Rwanda integration

This project is a portal preview; it is not connected to University of Rwanda identity,
student information, finance, library, or transcript systems. Student accounts, request
progress, and submitted files are persisted by the portal backend, but are not verified
against official University records. Do not treat reviewer decisions, documents, or generated
summaries as official University data.

An authorized University ICT/data owner must provide and approve the integration before the
portal can use live records. Obtain, through official University channels:

- The approved identity-provider protocol and test environment (for example, OIDC or SAML),
  plus the required application registration and reviewer role provisioning.
- Documented, least-privilege APIs or an approved integration method for student identity,
  enrollment, college/program, and the service records the portal is allowed to use.
- The authoritative clearance/transcript requirements, workflow owners, fee information,
  notification rules, and the source of truth for approval status and issued documents.
- Written data-protection, information-security, retention, audit, and incident-response
  requirements for student information and uploaded documents.

After approval, replace the preview backend's server-stored accounts and requests with a
University-managed backend.
Enforce server-side identity and role checks on every request and file operation, use HTTPS,
store files in approved access-controlled storage, keep credentials in managed secrets, and
test against University sandbox records before any production launch. Do not put University
API credentials or private student records in frontend code or `.env` files shipped to browsers.
The final-approval email endpoint is for local preview only; Vercel returns an
unavailable response until server-side University SSO and reviewer authorization
are implemented. Before release, add verified role checks, request-state
validation, institution-approved storage for issued PDFs, and approved email
content. Do not upload real student records to this preview deployment.
