# TuniFia — AI-Powered Fintech Platform

TuniFia is a Next.js fintech application for personal finance management, smart automation, and AI-assisted insights. It combines core money tracking with modern workflows like bill and check management, investment dashboards, and explainable loan readiness.

## Core Features

### Accounts & Transactions
- Multi-account support with default account handling
- Transaction creation and updates with recurring scheduling
- Category-based analytics

### Bills
- Create, track, and pay bills
- AI bill scanning (image → field extraction → review & confirm)
- Automated reminders via Inngest + Resend

### Checks
- Issued and received checks tracking
- Pending/cleared/bounced statuses
- Risk monitoring for insufficient funds with proactive alerts
- AI check scanning with confidence indicators and review step

### Loan Readiness (RAG)
- Embeddings from Sentence Transformers (no credit scores)
- Similarity search over historical cases (Qdrant)
- OpenRouter LLM produces qualitative readiness explanation
- Transparent, non-judgmental guidance + disclaimer

### Investments
- Crypto market data, watchlists, and analytics
- Live data integrations

## Tech Stack

- **Frontend**: Next.js App Router, React, Tailwind
- **Auth**: Clerk
- **Database**: Supabase Postgres + Prisma
- **Vector Store**: Qdrant
- **AI/LLM**: OpenRouter (reasoning/explanations only)
- **Embeddings**: Sentence Transformers (all-MiniLM-L6-v2)
- **Jobs**: Inngest
- **Email**: Resend

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file with the following:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=

# Database (Supabase Postgres)
DATABASE_URL=
DIRECT_URL=

# AI / LLM
OPENROUTER_API_KEY=

# Email
RESEND_API_KEY=
RESEND_FROM=

# Qdrant
QDRANT_URL=
QDRANT_API_KEY=
QDRANT_COLLECTION=loan_embeddings

# Supabase Storage (for check scans)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_CHECKS_BUCKET=check-scans
```

## Data Seeding — Loan Readiness

Place the dataset at:

```
data/loan_approval_dataset.csv
```

Build the combined profile dataset:

```bash
node scripts/loans/build-loan-profiles.mjs
```

Seed embeddings into Qdrant:

```bash
node scripts/loans/seed-loan-embeddings.mjs
```

## Important Notes

- The loan readiness feature **does not use CIBIL or credit scores**.
- The LLM provides **qualitative** readiness only (no numeric scoring).
- AI scanning always requires user review and confirmation.
- Check scans are uploaded temporarily and removed after processing.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run inngest` — run Inngest dev server

## Disclaimer

Loan readiness results are based on similarity to historical cases and are for informational purposes only. They do not guarantee loan approval.
