# Copilot Instructions

## Project Overview

Rocket Auth Server is a self-hosted authentication server built with Rust and the Rocket framework. It uses cookie-based sessions (Argon2-hashed passwords stored in SQLite) and is designed to sit behind an nginx reverse proxy that uses the `auth_request` module to gate access to other services on the same local network.

## Architecture

```
Browser
  └── nginx (TLS termination, auth_request gating)
        ├── auth.lab.home.arpa  →  rocket-auth (Rocket/Rust)
        └── testapp.lab.home.arpa  →  /var/www/testapp (static files, gated)
```

- **`src/main.rs`** – Rocket entry point; mounts `/api` routes and a static file server with SPA fallback.
- **`src/auth.rs`** – Login, logout, and verify endpoints. Sets/removes a private `session` cookie scoped to `.lab.home.arpa`.
- **`src/db.rs`** – `UsersDb` pool and startup check that the SQLite file exists.
- **`src/lib.rs`** – Shared types (`Credentials`, `AuthenticatedUser` request guard) and static dir resolution.
- **`src/bin/create_user.rs`** – CLI tool to create users with hashed passwords; creates the DB schema on first run.
- **`frontend/`** – React + TypeScript (Vite) login UI; built into `static/` at Docker image build time.
- **`nginx/sites-available/`** – Per-site nginx configs mounted into the container as `conf.d/`.
- **`nginx/snippets/auth.conf`** – Reusable `auth_request` block; include it in any site that should be gated.
- **`nginx/snippets/ssl.conf`** – TLS config referencing `certs/rocket-auth.crt` and `certs/rocket-auth.key`.
- **`docker-compose.yml`** – Defines `nginx` and `rocket-auth` services on an isolated `authnet` network.

## Key Conventions

- **Cookie domain** is currently hardcoded to `.lab.home.arpa` in `src/auth.rs`. All protected sites must share this domain suffix.
- **Private cookies** use Rocket's secret key (stored in `ROCKET_SECRET_KEY`) for encryption; rotating this key invalidates all active sessions.
- **The `db/` directory** is bind-mounted into the container. The SQLite file is opened read-only by the server (`?mode=ro`); `create-user` opens it with `?mode=rwc`.
- **TLS certificates** are generated with `mkcert` and named `certs/rocket-auth.crt` / `certs/rocket-auth.key` to match `nginx/snippets/ssl.conf`.
- **Static assets** are embedded in the Docker image at build time from `frontend/`. Do not serve them from a bind mount in production.

## Adding a New Protected Site

1. Add an nginx config to `nginx/sites-available/` with `include /etc/nginx/snippets/auth.conf;`.
2. Ensure the new domain shares the same root domain as the cookie (currently `.lab.home.arpa`).
3. Add a DNS record pointing the new hostname to the host machine's IP.
4. Regenerate TLS certificates to include the new domain (see README).

## Planned Improvements

### Configurable Domain via Environment Variables

The cookie domain (`.lab.home.arpa`) and auth server URL (`https://auth.lab.home.arpa`) are hardcoded. The intended approach is:

- Add `AUTH_COOKIE_DOMAIN` and `AUTH_URL` environment variables.
- Read `AUTH_COOKIE_DOMAIN` in `src/auth.rs` (via `std::env::var`) when constructing the `Cookie` in `login` and `logout`.
- Use nginx `envsubst` templates (rename configs to `.conf.template`, switch to `nginx:alpine` entrypoint with `envsubst`) so `auth.conf` can reference `$AUTH_URL` rather than a hardcoded hostname.

### Wildcard Certificates

Using `mkcert -cert-file certs/rocket-auth.crt -key-file certs/rocket-auth.key "*.lab.home.arpa"` avoids having to regenerate the certificate every time a new site is added. The root CA must already be installed (`mkcert -install`).

## Technology Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Backend   | Rust 1.95+, Rocket 0.5, SQLx (SQLite)           |
| Frontend  | React 18, TypeScript, Vite                      |
| Proxy     | nginx (alpine)                                  |
| Auth      | Argon2 password hashing, Rocket private cookies |
| Container | Docker Compose                                  |
| Certs     | mkcert (local CA)                               |
