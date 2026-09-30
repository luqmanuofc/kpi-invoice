# gst-worker

Small always-on service, deployed to your Tailscale VPS -- not part of the
Netlify app build (`netlify.toml` doesn't touch this directory). It holds a
live Playwright browser session open across two HTTP requests: show a buyer's
GST captcha, wait for a human to type the answer, submit it on the *same*
page. That's why this can't be a Netlify Function -- those are stateless and
ephemeral, and can't hold a browser session open between two separate
invocations. See `../EWAY_BILL.md` and the plan this was built from for the
full reasoning.

Talks to nothing but the public GST Search Taxpayer portal
(`services.gst.gov.in/services/searchtp` -- no login, no OTP, same tool
`scripts/gstin-lookup` already automates). Never touches your database --
`netlify/functions/startGstLookup.ts` and `submitGstCaptcha.ts` are the only
things that call it, and only `submitGstCaptcha.ts` writes to Postgres
(a `GstVerification` row), after the worker hands back a successful result.

## One-time VPS setup

Tested against a plain Debian/Ubuntu VM. Run as a user that can `sudo`
(needed once, for Playwright's system libraries).

```bash
# 1. Node (skip if already installed -- v20+ needed)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone this repo somewhere on the VPS (or `git pull` if it's already there)
git clone <this repo's URL> kpi-invoice
cd kpi-invoice/gst-worker

# 3. Install deps + the actual browser binary + its system libraries
npm install
npx playwright install --with-deps chromium

# 4. Configure
cp .env.example .env
# edit .env: set WORKER_SHARED_SECRET to a long random value
#   (openssl rand -hex 32), matching GST_WORKER_SECRET in Netlify's env vars
```

## Run it as a systemd service

So it survives reboots and restarts itself if it crashes. Adjust `User=` and
the path in `WorkingDirectory=`/`ExecStart=` to match your setup.

```ini
# /etc/systemd/system/gst-worker.service
[Unit]
Description=gst-worker
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/home/YOUR_USER/kpi-invoice/gst-worker
ExecStart=/usr/bin/node server.mjs
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gst-worker
sudo systemctl status gst-worker   # confirm it's running
curl localhost:3000/health          # -> {"ok":true}
```

## Expose it via Tailscale Funnel

Funnel gives you a stable `https://<machine>.<tailnet>.ts.net` URL with TLS
already handled, without opening up anything else on the box. Confirmed
already enabled on this tailnet.

```bash
sudo tailscale funnel 3000 on
tailscale funnel status   # shows the public URL this maps to
```

That URL is what you set as `GST_WORKER_URL` in Netlify's environment
variables (Site settings -> Environment variables), alongside
`GST_WORKER_SECRET` set to the same value as this box's `WORKER_SHARED_SECRET`.

## Updating

```bash
cd kpi-invoice && git pull
cd gst-worker && npm install   # only if dependencies changed
sudo systemctl restart gst-worker
```

Restarting drops any in-flight lookup sessions (someone mid-captcha loses
their progress and needs to click "Fetch GST Info" again) -- acceptable
given how rarely this runs; no attempt is made to preserve sessions across a
restart.

## API

Both endpoints require `Authorization: Bearer <WORKER_SHARED_SECRET>`.
`/health` doesn't.

- `GET /health` -> `{ ok: true }`
- `POST /lookup/start` `{ gstin }` -> `{ sessionId, captchaImage }`
  (`captchaImage` is base64-encoded PNG)
- `POST /lookup/answer` `{ sessionId, answer }` -> one of:
  - `{ status: "success", data: {...} }` -- same field shape
    `scripts/gstin-lookup/lookup-and-store.mjs`'s `lookupOne()` returns
  - `{ status: "wrong_captcha", captchaImage }` -- try again with this session
  - `{ status: "failed" }` -- 4 wrong attempts, session closed
  - `{ status: "not_found" }` -- unknown or expired `sessionId` (sessions
    idle-timeout after 5 minutes)
