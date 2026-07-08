# DEPLOYMENT.md — Production deployment on one server, one public IP

This file documents the nginx + Docker production setup added to this
repo. It does **not** replace `README.md` (the project's main docs) —
it's specifically about going live on a real server behind nginx.

## Why you don't need multiple IPs for multiple companies

This app is **already** built as a proper multi-tenant SaaS:
- One Django backend, one database.
- Every company is a row in the `Company` table (`backend/company/models.py`).
- A request is routed to the right company primarily by **subdomain**
  (e.g. `aalu.localhost:3000`, or `aalu.yourdomain.com` in production)
  — resolved in `Company.resolve_from_request()`. It also supports a
  `company` query param, an `X-Company-Slug` header, and the JWT's
  `company_id` claim as fallbacks — read in
  `backend/account/middleware.py` (`TenantMiddleware`).
- Every queryset filters by `request.user.company` / `request.company`.

So "one IP for many companies" isn't something you need to build — the
app already works that way. You only need ONE correctly configured
nginx in front of it, on your one IP, with one SSL certificate for your
one domain. Onboarding company #2, #50, #500 is just an API call to
`/api/superadmin/companies/` — zero infrastructure changes.

## What was added/changed in this repo

| Path | Status | What / Why |
|---|---|---|
| `nginx/Dockerfile` | **new** | Builds the nginx image used as the public-facing reverse proxy |
| `nginx/algoflow.conf` | **new** | Default HTTP-only nginx config — works immediately on `localhost`, no SSL cert required |
| `nginx/algoflow-ssl.conf.example` | **new** | HTTPS version of the config, for when you have a real domain + Certbot cert (see "Going to HTTPS") |
| `nginx/proxy_params.conf` | **new** | Shared proxy headers (Host, X-Forwarded-Proto, etc.), included by `algoflow.conf` |
| `entrypoint.sh` | **replaced** | Was **0 bytes** in this repo — the container would exit immediately. Now runs DB wait → `migrate` → `collectstatic` → starts the app directly via `node dist/server.mjs`. Original empty file kept as `entrypoint.sh.original.empty.bak`. |
| `docker-compose.yml` | **replaced** | Original only had a single `algoflow` service (SQLite, no nginx). New version adds `nginx`, `db` (Postgres), `redis`, and publishes port 3000 (needed because the app generates subdomain URLs that hit Node directly). Original kept as `docker-compose.yml.original.bak`. |
| `Dockerfile` | **modified** | `pip install` now uses `--break-system-packages --no-cache-dir --retries 10 --timeout 120` (fixes PEP 668 partial-install bug and PyPI timeout flakiness). Added `curl` so the healthcheck works. |
| `server.ts` | **modified** | Fixed misleading `http://0.0.0.0:PORT` log message. **More importantly:** turned off `changeOrigin` on the Django proxy and explicitly forwards the original `Host` as `X-Forwarded-Host` — without this, multi-tenant subdomain detection silently breaks (see Troubleshooting). |
| `run_backend.ts` | **modified** | Applied the same `--break-system-packages` fix to its fallback pip install path. |
| `backend/fixitall_backend/settings.py` | **modified** | `CSRF_TRUSTED_ORIGINS` now also generates a `:3000` port variant for wildcard subdomain hosts — needed because subdomain requests hit Node on port 3000 directly, and Django's CSRF check requires an exact port match. |
| `.env.production.example` | **new** | Env var template for the new compose stack, defaulting `DJANGO_ALLOWED_HOSTS` to allow `*.localhost` subdomains for local testing. Your existing `.env.example` is untouched — that one is for AI Studio/Gemini secrets, a different purpose. |
| `index.html` | **modified** | Added a boot-time fallback UI that shows a real error message (instead of a blank white page) if React fails to mount, a script error fires, or nothing renders within 8 seconds. |
| `src/main.tsx` | **modified** | Added global `unhandledrejection`/`error` listeners so silent async failures show up in the console with a clear prefix — `ErrorBoundary` alone can't catch these. |
| `vite.config.ts` | **modified** | Same `changeOrigin: false` fix applied to the Vite dev server's API proxy, for consistency with `server.ts` (only relevant if you ever run `npm run dev` outside Docker). |

### About the switch to Postgres

The original `docker-compose.yml` bind-mounted `backend/db.sqlite3`
directly — fine for development, risky for production with concurrent
writes across multiple companies. Your `backend/requirements.txt`
already includes `psycopg2-binary` and `dj-database-url`, and
`settings.py` already reads `DATABASE_URL` to configure the DB — so
Postgres was already supported by the code, just not wired into
`docker-compose.yml`. The new compose file adds a `db` (Postgres)
service and points `DATABASE_URL` at it.

**If you want to keep SQLite for now** (e.g. you're still testing),
remove the `db:` service from `docker-compose.yml`, remove
`depends_on: db` from the `app` service, and remove the
`DATABASE_URL` line under `app: environment:` — the app will fall back
to SQLite exactly like before. You can switch to Postgres later
without any code changes.

## Setup steps

### 1. Edit `.env`

```bash
cp .env.production.example .env
```

Fill in real values — especially `DJANGO_SECRET_KEY`,
`SIMPLE_JWT_SECRET_KEY`, and `POSTGRES_PASSWORD`. Generate strong
random secrets with:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

### 2. Build and start everything

The default nginx config (`nginx/algoflow.conf`) runs on **plain
HTTP, port 80, no domain or SSL certificate required** — it works
immediately on `localhost` for local testing, and on your server's
raw IP address for an early production check.

```bash
docker compose build
docker compose up -d
docker compose logs -f
```

Once it's running:
- **Frontend + everything**: `http://localhost/` (or your server's
  public IP if running remotely)
- Do **not** visit port `3000` or `8001` directly — those aren't
  published to your host on purpose; nginx (port 80) is the only
  public entry point. See "Troubleshooting" below if you need to
  debug them directly.

### 3. Create your superadmin user

```bash
docker compose exec app bash -c "cd backend && python manage.py shell"
>>> from account.models import MyUser
>>> MyUser.objects.create_superuser('admin@yourdomain.com', 'Admin', 'StrongPassword123!')
>>> exit()
```

### 4. Create your first company

```bash
curl -X POST http://localhost/api/superadmin/companies/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPERADMIN_JWT" \
  -d '{
    "name": "TechStore Nepal",
    "slug": "techstore-nepal",
    "email": "admin@techstore.com",
    "admin_name": "Raj Poudel",
    "admin_email": "raj@techstore.com",
    "admin_password": "SecurePassword123!",
    "plan": "pro"
  }'
```

Visit `http://techstore-nepal.localhost:3000/` — that company's
storefront is now live (subdomains resolve to `127.0.0.1`
automatically in your browser, no setup needed — see
"Troubleshooting" if it doesn't load).

## Going to HTTPS (once you have a real domain)

The HTTP-only setup above is fine for testing, but a real public
launch needs HTTPS. Because this app routes companies by **subdomain**
(`aalu.yourdomain.com`), you need a **wildcard certificate**
(`*.yourdomain.com`), not a single-domain one. Wildcard certs can only
be issued via the **DNS-01 challenge**, which means proving you
control the domain through a DNS TXT record — not the simpler
`--standalone` HTTP method used for single domains.

### 1. Point your domain at your server's public IP

At your DNS provider, for your domain:
```
Type    Name    Value
A       @       <YOUR_SERVER_PUBLIC_IP>
A       *       <YOUR_SERVER_PUBLIC_IP>
```
The `*` (wildcard) A record routes every subdomain
(`aalu.yourdomain.com`, `daraz.yourdomain.com`, ...) to the same one
IP — no new DNS entry needed per company, ever.

### 2. Get a wildcard SSL certificate via DNS-01

The exact command depends on your DNS provider, since Certbot needs a
plugin that can create the verification TXT record automatically.
Common ones:

```bash
# Cloudflare example
sudo apt install certbot python3-certbot-dns-cloudflare
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /path/to/cloudflare.ini \
  -d yourdomain.com -d '*.yourdomain.com'
```
```bash
# Route53 (AWS) example
sudo apt install certbot python3-certbot-dns-route53
sudo certbot certonly --dns-route53 \
  -d yourdomain.com -d '*.yourdomain.com'
```
If your DNS provider isn't Cloudflare or Route53, search
`certbot-dns-<your-provider>` — most major providers have a plugin.
If none exists, you can also add the TXT record manually with
`certbot certonly --manual --preferred-challenges dns -d yourdomain.com -d '*.yourdomain.com'`,
which will pause and tell you exactly what TXT record to add.

### 3. Switch nginx to the SSL config

```bash
cd nginx
mv algoflow.conf algoflow-http-only.conf.bak
mv algoflow-ssl.conf.example algoflow.conf
cd ..
```

Edit `nginx/algoflow.conf` and replace every `yourdomain.com` with
your real domain.

### 4. Re-enable port 443 in `docker-compose.yml`

Uncomment this line under the `nginx:` service:
```yaml
      - "443:443"
```
And add the cert volume mounts back under `nginx: volumes:`:
```yaml
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - certbot_www:/var/www/certbot
```
And add `certbot_www:` back under the top-level `volumes:` section.

### 5. Rebuild and restart

```bash
docker compose build nginx
docker compose up -d
```

### 6. Set up auto-renewal (certs expire every 90 days)

DNS-01 renewal doesn't need port 80 free, so there's no need to stop
nginx for renewal (unlike the `--standalone` method):
```bash
sudo crontab -e
# add this line:
0 3 * * * certbot renew --quiet --deploy-hook "docker compose -f /path/to/docker-compose.yml restart nginx"
```


## Troubleshooting

### `ModuleNotFoundError: No module named 'urllib3'` (or other packages missing despite being in requirements.txt)

**Cause:** the `python:3.12-slim` base image now enforces
[PEP 668](https://packaging.python.org/en/latest/specifications/externally-managed-environments/)
(`externally-managed-environment`). Without `--break-system-packages`,
pip can silently fall back to a partial/user-mode install instead of
hard-failing, leaving some packages missing even though they're listed
in `requirements.txt`. You'll see the broken packages installed to
`/root/.local/lib/python3.12/site-packages` instead of the normal
system path.

**Fix (already applied in this repo's `Dockerfile`):**
```dockerfile
RUN pip install --no-cache-dir --break-system-packages -r backend/requirements.txt gunicorn
```

If you still hit this after pulling these changes, force a clean
rebuild (old Docker layers can be cached from before the fix):
```bash
docker compose build --no-cache app
docker compose up -d
```

### `ERR_ADDRESS_INVALID` when visiting `http://0.0.0.0:8001`

`0.0.0.0` is a **bind address** (means "listen on every network
interface"), not something you can visit in a browser. Use instead:

| Setup | Visit |
|---|---|
| `docker compose up` stack | `http://localhost` (nginx, port 80) or `https://yourdomain.com` in production |
| Running `npm run start` directly, no Docker | `http://localhost:3000` |

Port `8001` (raw Django/gunicorn) is intentionally **not** exposed to
your browser in the Docker setup — nginx and Node are the only public
entry points. If you need to hit Django directly while debugging
locally, temporarily add under the `app:` service in
`docker-compose.yml`:
```yaml
    ports:
      - "127.0.0.1:8001:8001"   # debug only - remove before production
```

### `./entrypoint.sh: line N: exec: npm: not found`

**Cause:** the Dockerfile's final stage only copies the `node` binary
from the build stage — it never had `npm` (a separate
wrapper-script-plus-library, not part of the single `node` binary).
`entrypoint.sh` was calling `npm run start` to launch the app, which
failed because `npm` doesn't exist in that image at all.

**Fix (already applied):** since `npm run start` was just running
`node dist/server.mjs` anyway (check `package.json`'s `"start"`
script), `entrypoint.sh` now calls `node dist/server.mjs` directly,
removing the dependency on `npm` at runtime entirely:
```bash
exec node dist/server.mjs
```

### `http://aalu.localhost:3000/` → `ERR_CONNECTION_REFUSED` when visiting a company's generated URL

**This app generates subdomain-based company URLs** (see
`backend/company/admin.py`, `backend/account/views.py`,
`backend/efrontend/views.py`) like `aalu.localhost:3000` — not the
path-based `/store/{slug}/` URLs assumed earlier in this doc. Good
news: `*.localhost` automatically resolves to `127.0.0.1` in every
modern browser and on macOS (RFC 6761) — **no `/etc/hosts` edit
needed.** The connection refusal had two real causes, both fixed:

1. **Port 3000 wasn't published to the host.** The compose setup
   originally only used `expose` (container-to-container only) for
   ports 3000 and 8001, assuming nginx (port 80) was the only public
   door. But this app's own backend code hardcodes links straight at
   port 3000, bypassing nginx entirely. **Fixed:** `docker-compose.yml`
   now publishes `3000:3000` to your host, so
   `http://aalu.localhost:3000` actually reaches something.

2. **Even once reachable, tenant detection would have silently
   broken.** `server.ts` proxies `/api`, `/django-admin`, etc. to
   Django with `changeOrigin: true`, which rewrites the `Host` header
   to the internal target (`127.0.0.1:8001`) before Django ever sees
   it. Django's tenant resolution (`Company.resolve_from_request` in
   `backend/company/models.py`) reads the `Host` header to detect
   which company subdomain a request came from — losing it meant
   every subdomain request would silently fall back to "the first
   company in the database" instead of the correct one. **This was a
   real cross-tenant data risk, not just a connectivity bug.** Fixed:
   `changeOrigin` is now `false` and the original `Host` is
   explicitly forwarded as `X-Forwarded-Host`, which
   `resolve_from_request` checks first.

3. **`DJANGO_ALLOWED_HOSTS` and CSRF.** If you set
   `DJANGO_ALLOWED_HOSTS` to a literal domain list (no leading dot),
   Django rejects every subdomain with a 400 error. Use a
   leading-dot entry to allow all subdomains:
   ```
   DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,.localhost
   ```
   `.env.production.example` now ships with this for local dev.
   `settings.py` was also patched to add the `:3000` port variant to
   `CSRF_TRUSTED_ORIGINS` for wildcard hosts — without it, logging in
   from any company subdomain would fail CSRF validation.

**Known related item, not fixed (flagging for your awareness):**
`settings.py` has `CORS_ALLOW_ALL_ORIGINS = True` hardcoded — meaning
the `CORS_ALLOWED_ORIGINS` environment variable is currently
**ignored entirely**, and any website can make cross-origin requests
to your API. Fine for early local testing; should be tightened (set
to `False`, rely on `CORS_ALLOWED_ORIGINS`) before a real public
launch. Ask if you'd like this locked down.

### nginx container keeps restarting (exit code 1) right after `docker compose up`

**Cause:** the nginx config expects an SSL certificate at
`/etc/letsencrypt/live/yourdomain.com/...`. If you haven't set up a
domain + run Certbot yet (e.g. you're just testing on `localhost`),
that file doesn't exist, so nginx fails to start with something like
`nginx: [emerg] cannot load certificate`.

**Fix (already applied):** the default `nginx/algoflow.conf` is now
HTTP-only (port 80, `server_name _;`) and needs no certificate at all
— it works immediately on `localhost` or your raw server IP. The SSL
version is kept as `nginx/algoflow-ssl.conf.example` for when you're
ready to add a real domain — see "Going to HTTPS" above for the exact
switch-over steps.

If you still see nginx crash-looping after pulling these changes,
check what it's actually complaining about:
```bash
docker compose logs nginx --tail 50
```

### `pip install` fails with `ReadTimeoutError: HTTPSConnectionPool(host='files.pythonhosted.org'...) Read timed out`

**Cause:** a slow or flaky network connection to PyPI during the
Docker build — not a bug in the project itself. Large wheels (Django,
Pillow, cryptography, etc.) can time out on a single attempt.

**Fix (already applied):** `pip install` now runs with explicit
retries and a longer per-request timeout:
```dockerfile
RUN pip install --no-cache-dir --break-system-packages \
    --retries 10 \
    --timeout 120 \
    -r backend/requirements.txt gunicorn
```
If it still fails, it's most likely your network/Docker Desktop's
internet connection at build time — try again, or build on a more
stable connection.


### `Found another file with the destination path 'admin/js/cancel.js'...` during `collectstatic`

Cosmetic warning, not an error. It happens because both
`django-jazzmin` and Django's built-in admin ship a file with the same
name; `collectstatic` keeps the first one found based on
`INSTALLED_APPS` order. This repo already lists `"jazzmin"` before
`"django.contrib.admin"` in `settings.py`, which is the correct order
— no further action needed.

### Company storefront shows a blank white page (e.g. `daraz.localhost:3000/`)

A white page means the browser successfully loaded the HTML and JS
bundle (otherwise you'd see a 404 or connection error), but the React
app failed to render anything visible. This was investigated in depth
across the API client, `StoreContext`, `Index`, `Header`, `Footer`,
`HeroBanner`, and `CategorySidebar` — all the company-data-dependent
code already defensively handles missing/empty data (optional
chaining, array fallbacks, try/catch around theme-color parsing,
etc), so no crash was found by static review alone.

**What's fixed in this pass regardless:**

1. **A real boot-time diagnostic, so this never shows pure white
   again.** `index.html` now has a fallback UI that appears
   automatically if React fails to mount within 8 seconds, or if any
   script error / unhandled promise rejection fires before something
   real renders into `#root`. It shows the actual error message and a
   reload button. React's `ErrorBoundary` can only catch errors during
   render — it cannot catch a script that fails to load, or an error
   in an async callback — this fallback covers those gaps.
2. **Global error/rejection logging** added in `main.tsx`, so any
   silent failure now at least appears in the browser console with a
   clear `[Uncaught Error]` or `[Unhandled Promise Rejection]` prefix.
3. The Host-header / tenant-resolution fixes from the previous section
   (`changeOrigin: false`, `X-Forwarded-Host`) also apply here — if
   the page was rendering blank because the API was silently returning
   the wrong company's data (or failing tenant resolution entirely),
   those fixes address the root cause.

**If you still see a white page after rebuilding:** the boot
fallback should now show you the actual error text directly on the
page — that message (or the browser console, with the new
`[Uncaught Error]` / `[Unhandled Promise Rejection]` logs) will say
exactly what failed. Common next steps depending on what it says:
- **Network error / 404 on `/api/...`** → check `docker compose logs app` for a Django-side stack trace.
- **"Cannot read properties of undefined/null"** → note the component name in the stack trace and share it; that pinpoints exactly which file needs a guard added.
- **Nothing in console, just the 8-second timeout message** → likely an API call that hangs without ever resolving or rejecting; check `docker compose logs app` and `docker compose logs db` for a backend issue.

## A note on scaling further

If you eventually outgrow "ForeignKey-based tenant isolation on one
DB" (e.g. one enterprise client wants full physical isolation), the
path is **not** "give them their own IP." It's giving them their own
Postgres database or schema, still reachable through this same nginx
+ same domain, differentiated by slug exactly like now — only the DB
routing inside Django changes. IP count never needs to grow.
