# CLEAR&TRANS

CLEAR&TRANS is a student-services portal prototype for organizing academic
clearance and transcript requests. Students can create an account, follow a
request through a reviewer workflow, upload supporting documents, and view
request updates from a dashboard. The interface also includes a reviewer
workspace and a private student document-library page.

> **Prototype notice:** This project is not connected to University of Rwanda
> identity, student, finance, library, clearance, or transcript systems.
> Accounts and request information are portal data only. The portal does not
> verify enrollment, issue official records, or provide University approval.
> Do not use it to make official decisions or upload real student records.

## Features

- Student signup with email confirmation and password-based sign-in.
- Student dashboard for clearance and transcript request progress.
- Supporting-document checklists and file uploads for requests.
- Reviewer preview workflow for document review and request status.
- Student document-library interface at `/documents`, restricted to the
  signed-in student's account.
- Local SQLite storage for development and optional Turso/libSQL storage for
  hosted deployments.
- Email delivery for signup verification when SMTP is configured.

The document-library UI is in place, but official PDF issuance and automatic
attachment delivery are **not enabled**. The current reviewer sign-in is a
browser-based preview and is not server-verifiable. Vercel blocks final
approval email delivery until University-approved SSO and reviewer
authorization are integrated. A document shown as completed in this prototype
is not an official transcript or clearance certificate.

## Technology

- React, TypeScript, Vite, and React Router for the web application.
- Express and TypeScript for the API.
- SQLite for local development; Turso/libSQL can be configured for persistent
  hosted storage.
- Nodemailer for signup-confirmation email, using an SMTP provider configured
  on the backend.

## Requirements

- Node.js 20.19+ or 22.12+.
- npm.
- SMTP account credentials to test email-confirmed signup.

## Run locally

From the repository root:

```bash
npm install
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env` and supply your SMTP provider settings. For local
development the backend uses `backend/data.sqlite` by default. Then start the
API and frontend together:

```bash
npm run dev
```

Open <http://localhost:5173/>. The API runs on port `4000`; Vite proxies `/api`
requests to it. Useful routes:

- `/signup` — create a student preview account.
- `/login` — sign in.
- `/dashboard` — student request overview.
- `/clearance` — clearance request checklist and review progress.
- `/transcript` — transcript request checklist and review progress.
- `/documents` — student document library.
- `/leader` — reviewer preview workspace.

Signup confirmation needs working SMTP settings. The example credentials in
`.env.example` are placeholders and cannot send email.

## Build and checks

Build the frontend:

```bash
npm run build
```

Build the backend:

```bash
npm run build --prefix backend
```

## Vercel deployment

The repository includes a Vercel API function and frontend configuration.
Configure the Vercel project to use the repository root, `npm run build` as the
build command, and `dist` as the output directory.

Set the following server-side environment variables in Vercel, then redeploy:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Vercel's function filesystem is ephemeral, so Turso credentials are required
for persistent accounts and requests. Never expose database or SMTP credentials
with a `VITE_` variable or commit them to the repository. Check
`https://<your-deployment>/api/health` for the API health response.

If you need to copy existing local portal data into Turso, configure the
Turso variables in `backend/.env` and run this once from the project root:

```bash
npm run migrate:turso --prefix backend
```

Keep a backup of `backend/data.sqlite` and verify migrated data before removing
any local copy.

## Production readiness and University integration

Before using this system with real students or official records, obtain
University authorization and integrate the approved identity provider (such as
OIDC or SAML), server-side reviewer roles, authoritative student/workflow APIs,
and institution-approved document storage. Add access controls, audit logging,
retention rules, and approved email templates. Final document release and
email attachment delivery remain disabled on Vercel until reviewer identity
can be verified server-side.

See [backend/README.md](./backend/README.md) for additional backend setup,
deployment, data migration, and integration notes.
