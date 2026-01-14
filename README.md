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
- `build.py`: Helper to auto-add new game entries to `site/games/index.html`.

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
2. Update the arrays in:
   - `site/index.html` (home page shelves + stats)
   - `site/games/index.html` (full games library list)

Optional: run the helper to append new game entries in the games library list:

```bash
python3 build.py
```

`build.py` scans `site/games/playable/` and `site/games/demos/` for new HTML
files, pulls their `<title>`, and appends missing entries to the `games` array
in `site/games/index.html`.
