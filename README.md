# R17 Repair Portal & Vault

Next.js app for the R17 Repair ecosystem: articles and SEO stay on [r17repair.my.id](https://r17repair.my.id), while the Vercel app provides the file catalog, account, token wallet, and contributor/admin workflows.

## Firebase Realtime Database schema

The server reads and writes the current snake_case schema:

| Path | Fields and purpose |
| --- | --- |
| `/settings` | `site_name`, `site_tagline`, `conversion_rate_idr_to_token`, `min_donation_amount`, `maintenance_mode`, `base_urls`, and optional QRIS/reward/storage settings. Do not store credentials or API keys here. |
| `/users/{uid}/profile` | `name`, `email`, `role`, `joined_at`, `avatar`, contributor status and application fields. |
| `/users/{uid}/wallet` | `tokens`, `total_donated`, and server-only `ledger` idempotency receipts. |
| `/files/{fileId}` | `title`, `category`, `subdomain_type`, `description`, `token_cost`, `downloads_count`, `view_url`, `download_url`, optional `github_raw_path`, `contributor_id`, and moderation metadata. |
| `/transactions/{trxId}` | `user_id`, `type`, `amount_idr`, `tokens_received`, `payment_gateway`, `status`, `payment_reference`, and timestamps. |
| `/payment_amount_reservations/{amountIdr}` | Server-only expiring reservation that prevents concurrent top-up requests from reusing a unique transfer amount. |
| `/download_logs/{logId}` | `user_id`, `file_id`, `tokens_deducted`, `timestamp`, operation status and idempotency fields. |

The catalog accepts existing file records without a `status` and records marked `published`; records marked `pending` or `rejected` are not shown or downloadable. `subdomain_type` takes precedence over the display `category`. The catalog maps `schematic`, `firmware`, and `tools` to their corresponding configured subdomains.

`database.rules.json` denies browser writes. The browser reads its own `/users/{uid}` subtree; all money, moderation, token and download mutations run through Firebase Admin in server routes. Deploy the rules after reviewing them:

```powershell
firebase deploy --only database
```

## Authentication and administrator access

Enable Google and Email/Password in Firebase Authentication and add the Vercel app domains to Firebase's authorized domains. Set `FIREBASE_ADMIN_UIDS` to a comma-separated list of real Firebase Auth UIDs, or use verified Firebase custom claims (`admin: true`). A `role: "admin"` value in Realtime Database is not, by itself, authorization for admin APIs.

## Environment variables

Set these in local `.env.local` and Vercel Project Settings. Never commit service account data or expose private values using a `NEXT_PUBLIC_` prefix.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://YOUR_PROJECT-default-rtdb.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_DATABASE_URL=https://YOUR_PROJECT-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
FIREBASE_ADMIN_UIDS=FIREBASE_AUTH_UID_OF_ADMIN

GITHUB_REPOSITORY=r17repair/repository
GITHUB_STORAGE_REPO=https://raw.githubusercontent.com/r17repair/repository/main/files/
NEXT_PUBLIC_DANA_QRIS_IMAGE_URL=https://r17repair.my.id/path/to/qris.png
NEXT_PUBLIC_DANA_MERCHANT_NAME=R17 Repair
```

Instead of `FIREBASE_SERVICE_ACCOUNT_JSON`, the server can use `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. `GITHUB_REPOSITORY` limits accepted raw GitHub links when a file record uses GitHub storage; `GITHUB_STORAGE_REPO` is needed to resolve relative `github_raw_path` values. GitHub storage is metadata/link-based: contributors upload assets to GitHub themselves and submit the file URL. The app does not upload files to Firebase or GitHub.

## Workflows

- `GET /api/vault/catalog?category=firmware|schematics|tools` returns safe catalog metadata from `/files`, including validated `view_url` and `download_url`.
- `POST /api/downloads` verifies Firebase Auth, checks the file and maintenance state, debits `/users/{uid}/wallet/tokens` transactionally, writes `/download_logs/{logId}`, updates `downloads_count`, and optionally awards a contributor reward.
- `POST /api/payments` accepts an IDR amount divisible by the configured conversion rate and creates a pending manual DANA Business/QRIS transaction with a unique transfer suffix. `PATCH /api/payments/{trxId}` records the user's transfer reference and optional HTTPS proof link.
- `PATCH /api/admin/payments/{trxId}` approves or rejects a payment after manual verification. Approval credits the wallet and `total_donated` idempotently.
- Contributors apply for approval and submit metadata at `/api/contributor/apply` and `/api/contributor/files`. Admins moderate applications/files and can edit public business settings in `/admin`.
- `GET /api/account` bootstraps `/users/{uid}/profile` and `/users/{uid}/wallet/tokens` on authenticated requests without replacing an existing wallet balance.

### Public file-link limitation

Files hosted on GitHub Pages or another public subdomain remain directly accessible to anyone who knows or shares the URL. The token check and debit apply to downloads initiated through this app; they cannot prevent direct access to a public `download_url`. For enforceable access control, store assets privately and deliver them through an authenticated proxy or short-lived signed URLs from private object storage. The current QRIS flow is also manual: a reference or uploaded proof is not payment confirmation; an administrator must verify the transfer before approval.

## Local development and checks

```powershell
npm install
npm run dev
npm run lint
npm run build
```
