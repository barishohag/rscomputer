# RS Computer POS

A browser based point of sale and shop operations app for RS Computer. It includes sales, customer dues, cash reconciliation, pending orders, shop settings, and JSON backup/export.

## Run locally

Install Node.js 20.9 or later, then run `npm install` and `npm run dev`. Open `http://localhost:3000`.

## Deploy on Vercel

Import `barishohag/rscomputer` as a Next.js project. Add these environment variables in **Project Settings → Environment Variables** for Production:

- `ADMIN_USERNAME` — set to `admin`
- `ADMIN_PASSWORD` — choose a unique password (at least 16 characters). Do not put it in GitHub or send it in chat.
- `AUTH_SECRET` — a random secret of at least 32 bytes. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` and paste it directly into Vercel.

Redeploy after saving the variables. Keep Vercel Authentication enabled until the custom login works. Then, if you want visitors to see the app's own username/password page, disable **Vercel Authentication** in **Settings → Deployment Protection**. The app login will then be the access gate.

## Sign-in behavior

The login API compares credentials with environment variables on the server and issues a signed, HTTP-only, secure-in-production cookie that expires after eight hours. The proxy checks that cookie for the dashboard and every dashboard file route. Sign out clears the cookie. `ADMIN_PASSWORD` and `AUTH_SECRET` are not shipped to the browser.

The starter register opens empty. New records are stored in the current browser's local storage and do not sync across devices.
