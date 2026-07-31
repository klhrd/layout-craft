# Self-Hosting Guide

LayoutCraft Studio is a fully static, local-first web app. There is **no
mandatory backend**: the app runs entirely in the browser with LocalStorage
persistence, and any static file server can host it.

This guide covers:

1. [Requirements](#requirements)
2. [Local install](#local-install)
3. [Production build](#production-build)
4. [Deploy options](#deploy-options)
5. [Docker / docker-compose](#docker--docker-compose)
6. [Optional: Supabase cloud sync](#optional-supabase-cloud-sync)
7. [Optional: Supabase self-host](#optional-supabase-self-host)
8. [Realtime collaboration status](#realtime-collaboration-status)

---

## Requirements

- **Node.js 18+** (only needed to build; not needed to _run_ the built output)
- npm 9+
- No database, no runtime server, no API keys to get started

## Local install

```bash
git clone https://github.com/klhrd/layout-craft.git
cd layout-craft
npm install
npm run dev        # dev server with hot reload → http://localhost:5173
```

The app is usable immediately, fully offline.

## Production build

```bash
npm run build      # emits a static site into dist/
npm run preview    # serves dist/ locally to verify the build
```

`dist/` is self-contained: `index.html` + hashed JS/CSS assets. No server-side
processing is required, so it can be served by any static host.

## Deploy options

| Option         | How                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------- |
| GitHub Pages   | Push to `master` — the repo's GitHub Actions workflow builds and deploys `dist/` automatically. |
| Any static CDN | Upload `dist/` to Netlify, Vercel, Cloudflare Pages, Surge, etc.                                |
| nginx          | Point `root` at the `dist/` folder (see below).                                                 |
| Docker         | Use the included `Dockerfile` / `docker-compose.yml` (see below).                               |

### nginx example

```nginx
server {
    listen 80;
    server_name layoutcraft.example.com;

    root /var/www/layoutcraft/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # hashed assets can be cached aggressively
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Docker / docker-compose

The repo ships a multi-stage `Dockerfile` (Node build stage → nginx runtime)
and a `docker-compose.yml` for one-command self-hosting:

```bash
docker compose up -d --build
# → http://localhost:8080
```

The container serves the production build. To override the port, set
`LC_HTTP_PORT` (default `8080`).

To enable optional cloud sync, pass the Supabase values as environment
variables **before** building (Vite inlines them at build time). They are
forwarded into the image as build args and are never stored in the image:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_ANON_KEY=your-anon-key-here \
docker compose up -d --build
```

(On Windows PowerShell, use `$env:VITE_SUPABASE_URL="..."` / `$env:VITE_SUPABASE_ANON_KEY="..."`
or a `.env` file in the repo root with those keys, then `docker compose up -d --build`.)

## Optional: Supabase cloud sync

Cloud sync is an optional add-on that requires **auth** (email magic link or
GitHub OAuth). It is currently disabled by default — see
[`docs/ROADMAP.md`](ROADMAP.md) "Product Positioning".

To enable it for your own instance:

1. Create a Supabase project (hosted at [supabase.com](https://supabase.com),
   or self-hosted — see next section).
2. Create `.env` with:

    ```env
    VITE_SUPABASE_URL=https://your-project.supabase.co
    VITE_SUPABASE_ANON_KEY=your-anon-key-here
    ```

3. Run the migration in
   [`docs/migrations/supabase-migration.sql`](migrations/supabase-migration.sql)
   in the Supabase SQL editor (creates the `projects` table with Row-Level
   Security).
4. Re-enable the auth UI, which is commented out in `src/js/app.js` and
   `index.html` (search for "account-free positioning" — un-comment
   instructions are inline), then rebuild.

Without env vars (or while the auth UI is disabled), every cloud call silently
no-ops and the app stays fully local.

## Optional: Supabase self-host

If you do not want to depend on the hosted Supabase SaaS, Supabase publishes
its own Docker self-hosting setup:

- Official repo: <https://github.com/supabase/supabase/tree/master/docker>
- Follow their README to start the full stack, then use the local API URL and
  `anon` key from `docker/.env` in your LayoutCraft `.env`.
- Run the `projects` migration (step 3 above) in the self-hosted SQL editor.

Note: a full Supabase self-host is heavy (many containers) — only do this if
you already run Supabase for other apps. LayoutCraft works fine without it.

## Realtime collaboration status

The collab scaffolding (Yjs CRDT adapter, presence overlay, follow mode) is
merged, but the **transport layer is not yet wired**: there is no
`y-websocket` (or similar) provider, so the Y.Doc currently syncs only within
one tab. True multi-user editing over the network is future work (P4 plan,
`docs/ROADMAP.md`). It will require a WebSocket server on your own host and is
independent of the static deployment above.
