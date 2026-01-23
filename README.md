# LRWM3 Games

Static hub for lightweight HTML games, prototypes, and short guides. The site is
intentionally simple: open a page, play, and move on.

## Project layout

- `site/index.html`: Home page with featured games, demos, and guides.
- `site/games/index.html`: Games library with search + filters.
- `site/games/playable/`: Full playable game pages.
- `site/games/demos/`: Prototype demo pages.
- `site/guides/`: Guide pages.
- `site/styles.css`: Shared styles.
- `build.py`: Helper to rebuild the games list in `site/games/index.html`.

## Local preview

Open `site/index.html` directly in your browser, or run a quick static server:

```bash
python3 -m http.server --directory site 8000
```

Then visit `http://localhost:8000/`.

## Adding games or guides

1. Drop a new HTML file into:
   - `site/games/playable/` for playable builds
   - `site/games/demos/` for demos
   - `site/guides/` for guides
2. Add page metadata in the `<head>` for games (tags should be lowercase and comma-separated):
   - `<meta name="game-description" content="Short blurb shown on the games list.">`
   - `<meta name="game-tags" content="comma, separated, tags">`
3. Update the arrays in:
   - `site/index.html` (home page shelves + stats)
   - `site/games/index.html` (full games library list)

Optional: run the helper to rebuild the games library list from page metadata:

```bash
python3 build.py
```

`build.py` scans `site/games/playable/` and `site/games/demos/`, then rebuilds
the `games` array in `site/games/index.html` using each page's `<title>`,
`game-description`, and `game-tags` values.

## Multiplayer Games

Multiplayer games are not static and require the `server.ts` backend to work. A simple Deno
server is provided that serves static files and handles WebSocket connections at
`/ws`.

## Deno server (WebSocket + static)

Run the Deno server that serves `site/` and handles `/ws`:

```bash
deno run --allow-net --allow-read --allow-env server.ts
```

Then visit `http://localhost:8080/` (WebSocket endpoint: `ws://localhost:8080/ws`).

## Caddy (DuckDNS)

1. Start the Deno server on port 8080 (see above).
2. Ensure DNS for `swing-climb.duckdns.org` points to this host.
3. Run Caddy from the project root:

```bash
sudo caddy run --config Caddyfile
```

This will terminate HTTPS for `https://swing-climb.duckdns.org/` and proxy to the Deno server.
