[![Rust](https://img.shields.io/badge/Rust-1.95.0-blue?style=flat-square&logo=rust)](https://www.rust-lang.org/)
[![CI](https://img.shields.io/github/actions/workflow/status/javidahmed64592/rocket-auth-server/ci.yml?branch=main&style=flat-square&label=CI&logo=github)](https://github.com/javidahmed64592/rocket-auth-server/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/github/actions/workflow/status/javidahmed64592/rocket-auth-server/docs.yml?branch=main&style=flat-square&label=Docs&logo=github)](https://github.com/javidahmed64592/rocket-auth-server/actions/workflows/docs.yml)
[![Release](https://img.shields.io/github/actions/workflow/status/javidahmed64592/rocket-auth-server/release.yml?style=flat-square&label=Release&logo=github)](https://github.com/javidahmed64592/rocket-auth-server/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- omit from toc -->
# Rocket Authentication Server

A self-hosted authentication server built with Rust and Rocket framework.
It provides a secure and efficient way to manage user authentication for your applications.

<!-- omit from toc -->
## Table of Contents

- [Prerequisites](#prerequisites)
- [Configure environment variables](#configure-environment-variables)
  - [Create the users database](#create-the-users-database)
  - [Generate TLS certificates](#generate-tls-certificates)
  - [Configure DNS](#configure-dns)
  - [Start the stack](#start-the-stack)
  - [Adding a new protected site](#adding-a-new-protected-site)
- [License](#license)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with the Compose plugin
- [mkcert](https://github.com/FiloSottile/mkcert) for generating locally-trusted TLS certificates

## Configure environment variables

Copy the example environment file and fill in the values:

```bash
cp .env.example .env
```

The following variables must be set:

| Variable | Description |
| --- | --- |
| `ROCKET_SECRET_KEY` | Secret key for Rocket's private cookie encryption. Rotate this to invalidate all sessions. |
| `ROCKET_DATABASES` | SQLite connection string pointing at the users database. |
| `AUTH_COOKIE_DOMAIN` | Domain scope for the session cookie (e.g. `.lab.home.arpa`). Must be a shared suffix of all protected hostnames. |
| `VITE_AUTH_COOKIE_DOMAIN` | Same value as above — baked into the frontend bundle at image build time to validate safe redirect URLs. |
| `AUTH_HOSTNAME` | Hostname of the auth server itself (e.g. `auth.lab.home.arpa`). Used in the nginx login-redirect URL. |
| `TESTAPP_HOSTNAME` | Hostname of the example protected app (e.g. `testapp.lab.home.arpa`). |

Generate a secret key for Rocket's private cookie encryption and paste it into `ROCKET_SECRET_KEY`:

```bash
openssl rand -base64 64
```

Set `ROCKET_DATABASES` to point at the local SQLite file:

```
ROCKET_DATABASES='{users_db={url="file:db/users.sqlite?mode=ro"}}'
```

### Create the users database

The database file does not exist until at least one user is created. Run the bundled `create-user` tool inside the container — Docker Compose will build the image on the first run:

```bash
docker compose run --rm rocket-auth ./create-user db/users.sqlite <username>
```

You will be prompted to enter and confirm the user's password.
The `db/` directory is bind-mounted into the container, so the file is written to your local `db/users.sqlite`.

Repeat this command for each additional user you want to create.

### Generate TLS certificates

The nginx config expects the certificate and key at `certs/rocket-auth.crt` and `certs/rocket-auth.key`. Use `mkcert` to generate them.
If you have not already installed the local CA, run `mkcert -install` first.

Generate a wildcard certificate covering your entire domain so you never need to regenerate it when adding new sites:

```bash
mkcert -cert-file certs/rocket-auth.crt -key-file certs/rocket-auth.key "*.lab.home.arpa"
```

Replace `*.lab.home.arpa` with a wildcard matching your `AUTH_COOKIE_DOMAIN` value.

### Configure DNS

Each hostname served by nginx must resolve to the IP address of the machine running the Docker stack.
How you do this depends on your local setup:

- **`/etc/hosts`** (Linux/macOS) — Add a line per hostname:
  ```
  192.168.1.x  auth.lab.home.arpa testapp.lab.home.arpa
  ```
- **Pi-hole or other local DNS** — Create a local DNS record for each hostname pointing to the host machine's IP.
- **Router DNS** — Some routers let you add custom DNS entries in their admin UI.

All hostnames must resolve on every device that needs to reach the services, not just the host machine.

### Start the stack

```bash
docker compose up -d
```

Navigate to `https://testapp.lab.home.arpa` in your browser (substituting your `TESTAPP_HOSTNAME`).
Your browser should trust the certificate because it was signed by the mkcert local CA.
You will be redirected to `https://auth.lab.home.arpa/login` (your `AUTH_HOSTNAME`) to log in.
After successful authentication, you will be redirected back to the original site.

### Adding a new protected site

1. Add `<NEWHOSTNAME>_HOSTNAME` (or reuse an existing variable) to your `.env` and reference it in a new `nginx/templates/<newhostname>-site.conf.template`, following the pattern in `testapp-site.conf.template`.
2. Include `include /etc/nginx/snippets/auth.conf;` in the server block to enable cookie-based auth gating.
3. Ensure the new hostname shares the same root domain as `AUTH_COOKIE_DOMAIN`.
4. The wildcard TLS certificate already covers any subdomain — no regeneration needed.
5. Add a DNS record for the new hostname pointing to the host machine's IP.
6. Add the new hostname env var to the nginx `environment` section in `docker-compose.yml`.
7. Restart the stack to apply the new config:
   ```bash
   docker compose up -d --force-recreate nginx
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
