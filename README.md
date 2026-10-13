# RS Computer POS

A browser based point of sale and shop operations app for RS Computer. It includes sales, customer dues, cash reconciliation, pending orders, shop settings, and JSON backup/export.

## Run locally

Install Node.js 20.9 or later, then run `npm install` and `npm run dev`. Open `http://localhost:3000`.

## Deploy on Vercel

Import `barishohag/rscomputer` as a Next.js project. Add these environment variables in **Project Settings → Environment Variables** for Production:

- `ADMIN_USERNAME` — set to `admin`
- `ADMIN_PASSWORD` — choose a unique password (at least 16 characters). Do not put it in GitHub or send it in chat.
- `AUTH_SECRET` — a random secret of at least 32 bytes.
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable key.
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` — the server-only Supabase key used by authenticated server routes. Never expose it to the browser or commit the real value.

After setting the variables, run the SQL in `supabase/schema.sql` in the Supabase SQL Editor and redeploy.

### Google and account registration setup

1. Create a Supabase project and add its URL, publishable key, and service role key to Vercel Production environment variables.
2. In Supabase **Authentication → Providers**, enable Email and Google. For Google, create a Web OAuth client in Google Cloud and enter its client ID and secret in the Supabase Google provider settings.
3. In Google Cloud, set the authorized redirect URI to the callback URL shown in the Supabase Google provider settings.
4. In Supabase **Authentication → URL Configuration**, set the site URL to `https://rscomputer-psi.vercel.app` and add `https://rscomputer-psi.vercel.app/login` to the allowed redirect URLs.
5. Run `supabase/schema.sql` in the Supabase SQL Editor.
6. Redeploy the Vercel project after adding environment variables.

New Google and email accounts start as pending. Sign in with the existing admin username and password, then open `/admin/access` to approve or reject requests. Only approved accounts can access the dashboard. The approval API uses the server-only service role key.

## Sign-in behavior

The original admin username/password remains available. It uses environment variables on the server and issues a signed, HTTP-only, secure-in-production cookie that expires after eight hours. Supabase verifies Google/email accounts; the app issues a separate signed cookie only after the account is approved. Sign out clears the app cookie.

## POS cloud backup

The dashboard reads its shared POS snapshot from the `pos_store` table and saves it after each sale, payment collection, cash count, order, or settings change. The signed-in app server performs the database access with a server-only Supabase secret; direct browser access is blocked by row-level security. Local storage remains as a fallback if the cloud store is unavailable. Run `supabase/schema.sql` once in the connected Supabase project's SQL Editor, connect that Supabase resource to the Vercel project, and redeploy.
