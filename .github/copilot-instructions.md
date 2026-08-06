# Copilot Instructions

## Project Overview

Rocket Auth Server is a self-hosted authentication server built with Rust and the Rocket framework. It uses cookie-based sessions (Argon2-hashed passwords stored in SQLite) and is designed to sit behind an nginx reverse proxy that uses the `auth_request` module to gate access to other services on the same local network.

## Architecture

```
Browser
  └── nginx (TLS termination, auth_request gating)
        ├── $AUTH_HOSTNAME      →  rocket-auth (Rocket/Rust)
        └── $TESTAPP_HOSTNAME   →  /var/www/testapp (static files, gated)
```

- **`src/main.rs`** – Rocket entry point; reads `AUTH_COOKIE_DOMAIN` from env at startup (panics if unset) and attaches it as managed state; mounts `/api` routes and a static file server with SPA fallback.
- **`src/auth.rs`** – Login, logout, and verify endpoints. Sets/removes a private `session` cookie scoped to the `CookieDomain` managed state value.
- **`src/db.rs`** – `UsersDb` pool and startup check that the SQLite file exists.
- **`src/lib.rs`** – Shared types (`Credentials`, `AuthenticatedUser` request guard) and static dir resolution.
- **`src/bin/create_user.rs`** – CLI tool to create users with hashed passwords; creates the DB schema on first run.
- **`frontend/`** – React + TypeScript (Vite) login UI; built into `static/` at Docker image build time. Reads `VITE_AUTH_COOKIE_DOMAIN` as a build arg to validate safe redirect URLs; throws at load time if unset.
- **`nginx/templates/`** – Per-site nginx config templates processed by the nginx alpine entrypoint with `envsubst` into `/etc/nginx/conf.d/`.
- **`nginx/snippets/auth.conf.template`** – Reusable `auth_request` block template; processed by a custom entrypoint command into `/etc/nginx/snippets/auth.conf` before the standard nginx entrypoint runs. Include it in any site that should be gated.
- **`nginx/snippets/ssl.conf`** – TLS config referencing `certs/rocket-auth.crt` and `certs/rocket-auth.key`.
- **`docker-compose.yml`** – Defines `nginx` and `rocket-auth` services on an isolated `authnet` network.

## Key Conventions

- **Cookie domain** is set via the `AUTH_COOKIE_DOMAIN` environment variable, read once at startup in `src/main.rs` and stored as Rocket managed state (`CookieDomain`). All protected sites must share this domain suffix.
- **Private cookies** use Rocket's secret key (stored in `ROCKET_SECRET_KEY`) for encryption; rotating this key invalidates all active sessions.
- **The `db/` directory** is bind-mounted into the container. The SQLite file is opened read-only by the server (`?mode=ro`); `create-user` opens it with `?mode=rwc`.
- **TLS certificates** are generated with `mkcert` as a wildcard (e.g. `*.lab.home.arpa`) and named `certs/rocket-auth.crt` / `certs/rocket-auth.key` to match `nginx/snippets/ssl.conf`.
- **Static assets** are embedded in the Docker image at build time from `frontend/`. Do not serve them from a bind mount in production.
- **Built-in service hostnames are configured via `.env`** (copy `.env.example` to get started). Site-specific proxy templates hardcode their `server_name` and upstream directly — no new env vars needed.
- **Protected nginx locations must set `Cache-Control: no-store`** so browsers always re-request through `auth_request` rather than serving stale cached content.

## Adding a New Protected Site

1. Create `nginx/templates/<appname>-site.conf.template`. Use `<appname>${AUTH_COOKIE_DOMAIN}` for `server_name` — only the app-name prefix is hardcoded; the domain is injected at container startup from the shared `AUTH_COOKIE_DOMAIN` env var. These site-specific templates are not committed to the repository; copy them onto the host as needed.
2. If the upstream runs on the **host machine** (outside Docker), use `proxy_pass http://host.docker.internal:<port>;` — `host.docker.internal` is mapped to the host via `extra_hosts` in `docker-compose.yml`.
3. Include `include /etc/nginx/snippets/auth.conf;` and `add_header Cache-Control "no-store" always;` in the protected location block.
4. Ensure the hostname shares the same root domain as `AUTH_COOKIE_DOMAIN` so the session cookie is sent.
5. The wildcard TLS certificate covers any subdomain — no regeneration needed.
6. Add a DNS record pointing the new hostname to the host machine's IP.
7. Restart nginx: `docker compose up -d --force-recreate nginx`.

## Technology Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Backend   | Rust 1.95+, Rocket 0.5, SQLx (SQLite)           |
| Frontend  | React 18, TypeScript, Vite                      |
| Proxy     | nginx (alpine)                                  |
| Auth      | Argon2 password hashing, Rocket private cookies |
| Container | Docker Compose                                  |
| Certs     | mkcert (local CA, wildcard)                     |
