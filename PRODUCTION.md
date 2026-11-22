# Production notes

## API key model

Users add their own Gemini API keys in the app (the API Keys button in the navbar).

- Keys are stored only in the browser: sessionStorage by default, localStorage when the user opts into "Remember on this device". They are never written to Firestore or to server disk.
- Keys are sent per request in the `x-gemini-keys` header, never in a URL or query string.
- The server builds a fresh ApiKeyPool for each request and never logs or persists key values.

## How the pool behaves

`server/keyPool.ts` implements the scheduler:

| Behavior | Detail |
| --- | --- |
| Parallelism | Each key is a single-flight slot. Batch jobs render up to min(keys, items) clips at once. |
| Rotation | The least-recently-used key is picked next, spreading quota evenly. |
| Rate limits (429) | Key enters exponential cooldown (1s to 15s), honoring Retry-After. |
| Auth errors (401/403) | Key is benched for 60s so one bad key cannot stall the pool. |
| Failover | The request retries on other keys before failing; attempts cap at 2x keys. |
| Timeouts | Requests abort once the pool deadline passes (KEY_POOL_TIMEOUT). |

## Server fallback keys

If a deployment wants a working pool without user setup, set GEMINI_API_KEY (or the
numbered variants) on the server. Browser-supplied keys always win when present.

## Hardening applied

- `x-powered-by` disabled; `trust proxy` enabled in production.
- Security headers: nosniff, X-Frame-Options, Referrer-Policy, COOP, Permissions-Policy, and HSTS in production.
- Per-IP fixed-window rate limits: 30/min on /api/tts and 10/min on /api/tts/batch.
- Input caps: 4000 chars per clip, 20 batch items, 25 keys per request, 8 KB header ceiling.
- Generic 500 messages in production so upstream details do not leak.
- Hashed build assets are served immutable; HTML is no-cache.

## Scaling notes

The rate limiter is in-memory, so it is per instance. For horizontal scaling, front the
app with a shared limiter (for example Redis-backed) or move limiting to your edge/CDN.
The key pool is per request and therefore already stateless.

## Build and run

```bash
npm install
npm run build
NODE_ENV=production npm start
```
