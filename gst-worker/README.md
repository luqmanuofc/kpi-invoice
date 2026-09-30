# gst-worker

Small always-on service, deployed to a Tailscale-networked machine you
control -- not part of the Netlify app build (`netlify.toml` doesn't touch
this directory). It holds a live Playwright browser session open across two
HTTP requests: show a buyer's GST captcha, wait for a human to type the
answer, submit it on the *same* page. That's why this can't be a Netlify
Function -- those are stateless and ephemeral, and can't hold a browser
session open between two separate invocations. See `../EWAY_BILL.md` and the
plan this was built from for the full reasoning.

Talks to nothing but the public GST Search Taxpayer portal
(`services.gst.gov.in/services/searchtp` -- no login, no OTP, same tool
`scripts/gstin-lookup` already automates). Never touches your database --
`netlify/functions/startGstLookup.ts` and `submitGstCaptcha.ts` are the only
things that call it, and only `submitGstCaptcha.ts` writes to Postgres
(a `GstVerification` row), after the worker hands back a successful result.

Runs in Docker. The machine actually running this turned out to be a
personal laptop rather than a dedicated VPS, so keeping Node, Chromium and
its ~30 apt dependencies off the host (and sandboxing the browser away from
the user's home directory) mattered more than it would on a throwaway
cloud box. A bare-metal/systemd alternative is documented at the bottom for
anyone deploying to an actual dedicated VPS instead.

## Setup (Docker)

Requires Docker with BuildKit (any reasonably recent Docker install --
`docker build --build-context` needs it) and Tailscale already installed and
authenticated on this machine, with Funnel enabled on the tailnet.

```bash
# 1. Clone this repo somewhere on the machine (or `git pull` if already there)
git clone <this repo's URL> kpi-invoice
cd kpi-invoice/gst-worker

# 2. Configure
cp .env.example .env
# edit .env: set WORKER_SHARED_SECRET to a long random value
#   (openssl rand -hex 32), matching GST_WORKER_SECRET in Netlify's env vars.
#   Leave PORT at its default (8420) unless that's already taken on this
#   machine, in which case pick another and update the -p mapping below to
#   match.

# 3. Build and run
docker build --build-context gstin-lookup=../scripts/gstin-lookup -t gst-worker .
docker run -d --name gst-worker --restart unless-stopped --init --ipc=host \
  -p 127.0.0.1:8420:8420 --env-file .env gst-worker
curl localhost:8420/health          # -> {"ok":true}
```

Notes on the build/run flags:

- `lookup.mjs` imports `../scripts/gstin-lookup/stateNames.mjs`, which lives
  outside this directory -- passed in as a named build context
  (`--build-context gstin-lookup=...`) rather than widening the Docker build
  context to the whole repo.
- The base image is `mcr.microsoft.com/playwright:v1.63.0-noble`, which
  ships Node and Chromium's system libraries already installed.
- `--ipc=host` avoids Chromium crashing from Docker's default tiny
  `/dev/shm`. `--init` gives the container a real PID 1 so a killed/zombie
  Chromium process doesn't linger. `--restart unless-stopped` gives the same
  crash/reboot resilience a systemd unit would.
- The port is published on `127.0.0.1` only -- Tailscale Funnel (below) is
  the sole way in from outside this machine.
- `.env` is passed with `--env-file` at run time and is excluded via
  `.dockerignore`; the shared secret never ends up baked into the image.

## Expose it via Tailscale Funnel

Funnel gives you a stable `https://<machine>.<tailnet>.ts.net` URL with TLS
already handled, without opening up anything else on the box.

```bash
sudo tailscale funnel --bg 8420
tailscale funnel status   # shows the public URL this maps to
```

That URL is what you set as `GST_WORKER_URL` in Netlify's environment
variables (Site settings -> Environment variables), alongside
`GST_WORKER_SECRET` set to the same value as this machine's
`WORKER_SHARED_SECRET`.

## Updating

```bash
cd kpi-invoice && git pull
cd gst-worker
docker build --build-context gstin-lookup=../scripts/gstin-lookup -t gst-worker .
docker rm -f gst-worker
docker run -d --name gst-worker --restart unless-stopped --init --ipc=host \
  -p 127.0.0.1:8420:8420 --env-file .env gst-worker
```

Logs: `docker logs -f gst-worker`.

Restarting drops any in-flight lookup sessions (someone mid-captcha loses
their progress and needs to click "Fetch GST Info" again) -- acceptable
given how rarely this runs; no attempt is made to preserve sessions across a
restart.

## Updating from this dev machine via SSH

The commands above have to run *on* the machine hosting the Docker
container -- gst-worker isn't deployed from CI/CD, so every code change
needs someone to actually log into that box and re-run the build/run
sequence. Relaying copy-paste instructions for a human to run there each
time is slow and error-prone (wrong path, stale `.env`, forgotten `funnel`
step), so instead this dev machine has direct SSH access to run the update
itself.

**How that's set up:** a dedicated SSH keypair, generated on this dev
machine specifically for this purpose (not reused from any other key),
with its public half appended to the target machine's
`~/.ssh/authorized_keys`. Key-based auth was chosen over Tailscale SSH
because Tailscale SSH needs an ACL policy change in the tailnet's admin
console beyond just enabling it locally, which turned out to be more setup
than generating and registering a key -- and over a plain password because
that would mean a credential passing through chat/session history, which
we specifically avoided.

**Where the actual connection details live:** `gst-worker/.deploy-target.local`
in this directory -- gitignored, not in this doc, because this repo is
public and that file has the real hostname/IP/username for someone's
personal machine. If you're picking this up on a fresh checkout of this
exact dev machine and that file is missing, the keypair and
`authorized_keys` entry may still be intact on the target machine (check
before regenerating) -- otherwise, re-establish access the same way
described there: generate a new keypair, have a human add the public half
to the target's `authorized_keys`, then recreate the file.

**The actual update, once connected**, is just the build/run sequence
from "Updating" above, run over SSH instead of an interactive shell:

```bash
ssh -i <key from .deploy-target.local> <user>@<host> \
  "cd <repo path> && git pull && cd gst-worker && \
   docker build --build-context gstin-lookup=../scripts/gstin-lookup -t gst-worker . && \
   docker rm -f gst-worker && \
   docker run -d --name gst-worker --restart unless-stopped --init --ipc=host \
     -p 127.0.0.1:8420:8420 --env-file .env gst-worker && \
   curl -s localhost:8420/health"
```

If the port ever changes, Funnel needs re-pointing too (`sudo tailscale
funnel <old-port> off` on newer Tailscale CLI versions may error with a CLI
syntax message -- ignore it, the important one is `sudo tailscale funnel
--bg <new-port>`; check `tailscale funnel status` afterward to confirm only
the new port's rule is active). Both `tailscale` commands need `sudo`,
which needs an interactive password this SSH flow can't supply
non-interactively -- ask a human to run those two specific commands
directly on the machine when a port change is involved.

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

## Alternative: bare VM + systemd

Not what's actually running -- kept for anyone deploying this to an actual
dedicated VPS instead of a shared personal machine, where keeping Chromium
off the host doesn't matter as much and a plain systemd unit is simpler.

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

# 4. Configure (same .env as above)
cp .env.example .env
```

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
curl localhost:8420/health          # -> {"ok":true}
sudo tailscale funnel --bg 8420
```

Updating:

```bash
cd kpi-invoice && git pull
cd gst-worker && npm install   # only if dependencies changed
sudo systemctl restart gst-worker
```
