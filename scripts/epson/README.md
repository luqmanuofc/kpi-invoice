# Epson Connect — manual token scripts

Standalone scripts for the one-time (or occasional) manual step of getting a
device token for the Epson Connect API. The app's own runtime code
(`netlify/lib/epson.ts`) refreshes tokens automatically once seeded — these
scripts are only for the initial handoff, or for recovering when that chain
is broken (e.g. a database restore wiped `EpsonConnection`, or the refresh
token expired from 30 days of inactivity). See `EPSON_OAUTH.md` at the repo
root for the protocol details; this folder is the practical "just run this"
version.

`tokens.json` gets written here by step 1 and read by steps 2 and 3. It
holds a live refresh token — it's gitignored, never commit it.

## Prerequisites

- `EPSON_CLIENT_ID`, `EPSON_CLIENT_SECRET`, `EPSON_API_KEY` set in the
  project's `.env` (from `developer.epsonconnect.com/applications/list`).
- The app registered with redirect URI `http://127.0.0.1:8934/callback`
  (Epson rejects the literal string `localhost` — must be the loopback IP).
- The printer already **user-registered** to an Epson ID (not just
  device-registered for Email Print) — see the "Prerequisites" note in
  `EPSON_OAUTH.md` if the authorize step comes back with `error=not_registered`.

## Step 1 — get a fresh token pair (needs your browser)

From the project root, so it picks up `.env`:

```
node scripts/epson/1-auth-setup.mjs
```

It starts a local server and prints an authorize URL. Open that URL in a
browser logged into the Epson ID the printer is registered under, approve
the printer, and the script will exchange the resulting code for tokens and
save them to `scripts/epson/tokens.json`. Leave the script running until it
prints "Saved tokens to..." — it's waiting for the browser redirect.

## Step 2 — optional: prove it actually works end to end

```
node scripts/epson/2-print-test.mjs /path/to/some.pdf
```

Creates a real print job, uploads the file, executes it, and polls status
until it's `completed` (or another terminal state). This actually prints —
don't point it at the printer with a blank sheet loaded if you don't want
a real page to come out.

## Step 3 — hand the tokens to the app

```
node scripts/epson/3-seed-app-db.mjs
```

Writes `tokens.json`'s access/refresh token into the app's `EpsonConnection`
table (whatever `DATABASE_URL` currently points at in `.env` — double check
that's the environment you mean to seed). After this, the app's own refresh
logic takes over and these scripts aren't needed again unless something
resets that table or the connection gets revoked.

## Step 4 — after deploying: register the status webhook

```
node scripts/epson/4-register-webhook.mjs https://your-deployed-site/.netlify/functions/epsonJobWebhook
```

Only works with a real, publicly reachable URL — Epson can't call back to
`localhost`. Uses a different credential (an "application token" via
client-credentials) than steps 1-3, so it doesn't depend on the device
token/`EpsonConnection` state at all. Re-run it any time the URL changes
(e.g. moving off a preview URL to a custom domain) — it's a plain overwrite,
not additive.
