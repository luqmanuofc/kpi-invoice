# Epson Connect API — OAuth flow (2026-09-23)

Notes on the OAuth device-authorization flow for the Epson Connect API (v2),
confirmed against Epson's own OpenAPI spec
(`https://docs.epsonconnect.com/en/yaml/APIReferenceV2-c.yaml`) and a working
proof-of-concept run.

This is the protocol reference. For ready-to-run scripts that actually do
this flow (and hand the result to the app), see `scripts/epson/README.md`.

## Redirect URI

Register a redirect URI on the app at
`https://developer.epsonconnect.com/applications/list`. **Epson rejects the
literal string `localhost`** in that field — use the loopback IP instead,
e.g. `http://127.0.0.1:8934/callback`.

## 1. Authorize

```
GET https://auth.epsonconnect.com/auth/authorize
    ?response_type=code
    &client_id={client_id}
    &redirect_uri={redirect_uri}
    &scope=device
```

Open this in a browser logged into the Epson ID the target printer is
registered under. Epson shows a login (if needed) then a picker of the
account's registered printers, and redirects back to `redirect_uri` with
`?code=...` once one is approved.

If it instead redirects back with `error=not_registered`, that's Epson's
documented error for "device (printer or scanner) is not registered in Epson
Connect" **for the account that just authenticated** — i.e. an account
mismatch, not a redirect_uri/config problem.

## 2. Exchange the code for tokens

```
POST https://auth.epsonconnect.com/auth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code={code}&redirect_uri={redirect_uri}&client_id={client_id}
```

Response:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "scope": "device",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

- `access_token` (the "device token") — lasts 1 hour, used as
  `Authorization: Bearer {access_token}` on every printing API call.
- `refresh_token` — lasts 30 days.
- No device ID is returned or needed anywhere — the access token itself is
  already scoped to the one printer that was authorized. Nothing
  device-specific goes in any later request path or body.

## 3. Refresh

```
POST https://auth.epsonconnect.com/auth/token
Authorization: Basic base64(client_id:client_secret)
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token={refresh_token}
```

**Epson rotates the refresh token on every refresh call** — the response
includes a new `refresh_token` each time, and the old one stops working.
Always persist whatever comes back, never reuse a previously stored value.

## Notes for a persistent (non-interactive) integration

- Refreshing regularly keeps the refresh token from ever going stale (it
  expires after 30 days of *not* being used) — a scheduled refresh (e.g.
  daily), independent of whether anyone actually prints that day, keeps the
  connection alive indefinitely without repeating the interactive authorize
  step.
- If a refresh ever fails outright, that means Epson revoked access
  out-of-band (e.g. the account owner changed their password or revoked the
  app) — only redoing the interactive authorize flow fixes that; no
  server-side retry can route around it.
