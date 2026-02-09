# TuniFia

TuniFia is a Next.js fintech platform for personal finance management with AI-assisted workflows. It combines everyday money tracking with bill and check management, investment views, and explainable loan readiness insights.

## Highlights

- Multi-account transactions with recurring scheduling and category analytics
- Bills management with AI-assisted scan and confirmation
- Check tracking with risk monitoring and scan review flow
- Loan readiness explanations using retrieval-augmented insights
- Investment dashboards and market data views
- new market investment for small buisnesses and startups
- Investment for the energy

## Tech Stack

- Next.js App Router, React, Tailwind
- Clerk for authentication
- Supabase Postgres + Prisma
- Qdrant for vector search
- OpenRouter for LLM explanations
- Sentence Transformers for embeddings
- Inngest for background jobs
- Resend for email
- LangGraph for multi Ai agent
- ML & DL models for predection

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

## Environment Variables

Create a `.env` file at the project root:

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

## Loan Readiness Data Seeding

Add the dataset:

```
data/loan_approval_dataset.csv
```

Build profiles:

```bash
node scripts/loans/build-loan-profiles.mjs
```

Seed embeddings into Qdrant:

```bash
node scripts/loans/seed-loan-embeddings.mjs
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run inngest` - run Inngest dev server

## Notes

- Loan readiness is qualitative and does not use credit scores.
- AI scan flows always require user review and confirmation.
- Uploaded scan files are temporary and cleaned after processing.

## Disclaimer

Loan readiness results are informational and do not guarantee approval.
