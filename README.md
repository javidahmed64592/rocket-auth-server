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

- [Running with Docker](#running-with-docker)
  - [Prerequisites](#prerequisites)
  - [1. Configure environment variables](#1-configure-environment-variables)
  - [2. Create the users database](#2-create-the-users-database)
  - [3. Generate TLS certificates](#3-generate-tls-certificates)
  - [4. Configure DNS](#4-configure-dns)
  - [5. Start the stack](#5-start-the-stack)
  - [Adding a new protected site](#adding-a-new-protected-site)
- [License](#license)

## Running with Docker

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) with the Compose plugin
- [mkcert](https://github.com/FiloSottile/mkcert) for generating locally-trusted TLS certificates

### 1. Configure environment variables

Copy the example environment file and fill in the values:

```bash
cp .env.example .env
```

Generate a secret key for Rocket's private cookie encryption and paste it into `ROCKET_SECRET_KEY`:

```bash
openssl rand -base64 64
```

Set `ROCKET_DATABASES` to point at the local SQLite file. Replace the placeholder value with:

```
ROCKET_DATABASES='{users_db={url="file:db/users.sqlite?mode=ro"}}'
```

### 2. Create the users database

The database file does not exist until at least one user is created. Run the bundled `create-user` tool inside the container — Docker Compose will build the image on the first run:

```bash
docker compose run --rm rocket-auth ./create-user db/users.sqlite <username>
```

You will be prompted to enter and confirm the user's password. The `db/` directory is bind-mounted into the container, so the file is written to your local `db/users.sqlite`.

Repeat this command for each additional user you want to create.

### 3. Generate TLS certificates

The nginx config expects the certificate and key at `certs/rocket-auth.crt` and `certs/rocket-auth.key`. Use `mkcert` to generate them. If you have not already installed the local CA, run `mkcert -install` first.

Generate a certificate covering all the hostnames you intend to serve. For example, using a wildcard so that you do not need to regenerate it when adding new sites:

```bash
mkcert -cert-file certs/rocket-auth.crt -key-file certs/rocket-auth.key "*.lab.home.arpa"
```

Alternatively, list specific hostnames:

```bash
mkcert -cert-file certs/rocket-auth.crt -key-file certs/rocket-auth.key \
    auth.lab.home.arpa testapp.lab.home.arpa
```

> **Note:** If you add a new site later and used the specific-hostname form, re-run the command with all hostnames (old and new) included.

### 4. Configure DNS

Each hostname served by nginx must resolve to the IP address of the machine running the Docker stack. How you do this depends on your local setup:

- **`/etc/hosts`** (Linux/macOS) — Add a line per hostname:
  ```
  192.168.1.x  auth.lab.home.arpa testapp.lab.home.arpa
  ```
- **Pi-hole or other local DNS** — Create an `A` record for each hostname pointing to the host machine's IP.
- **Router DNS** — Some routers let you add custom DNS entries in their admin UI.

All hostnames must resolve on every device that needs to reach the services, not just the host machine.

### 5. Start the stack

```bash
docker compose up -d
```

Navigate to `https://testapp.lab.home.arpa` in your browser. Your browser should trust the certificate because it was signed by the mkcert local CA.
You will be redirected to `https://auth.lab.home.arpa/login` to log in. After successful authentication, you will be redirected back to the original site.

### Adding a new protected site

1. Add an nginx config to `nginx/sites-available/` following the pattern in `testapp.lab.home.arpa.conf`. Include `nginx/snippets/auth.conf` to enable cookie-based auth gating.
2. Ensure the new hostname shares the same root domain as the session cookie (currently `.lab.home.arpa`).
3. If you generated a site-specific certificate rather than a wildcard, regenerate it to include the new hostname (see step 3).
4. Add a DNS record for the new hostname pointing to the host machine's IP.
5. Restart nginx to pick up the new config:
   ```bash
   docker compose restart nginx
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
