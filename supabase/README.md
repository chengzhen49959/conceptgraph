# Supabase

This template uses a **hosted Supabase project** (no local Docker stack). You only
need the Project URL and keys from **Project Settings → API**, placed in
`../frontend/.env.local` and `../backend/.env`.

## Applying SQL / migrations

The starter needs no tables. When you add your own schema, you have two options.

### Option A — SQL Editor (simplest)

1. Open your project's **SQL Editor** in the Supabase dashboard.
2. Paste your SQL and run it.

### Option B — Supabase CLI

```bash
# one-time
npm install -g supabase            # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF

# apply everything under migrations/
supabase db push
```

Put your `*.sql` files under `migrations/`. Enable Row Level Security on every
table holding user data, and scope each policy with `(select auth.uid())`.
