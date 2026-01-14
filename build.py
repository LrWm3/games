#!/usr/bin/env python3
import html
import re
import sys
from pathlib import Path


INDEX_PATH = Path("site/games/index.html")
PLAYABLE_DIR = Path("site/games/playable")
DEMOS_DIR = Path("site/games/demos")


def load_title(path: Path) -> str:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        return path.stem.replace("-", " ").replace("_", " ").title()
    match = re.search(r"<title>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return path.stem.replace("-", " ").replace("_", " ").title()
    title = html.unescape(match.group(1))
    title = re.sub(r"\s+", " ", title).strip()
    return title or path.stem.replace("-", " ").replace("_", " ").title()


def find_games_block(text: str):
    pattern = re.compile(r"(const games = \[)(.*?)(\n\s*\];)", re.DOTALL)
    match = pattern.search(text)
    if not match:
        return None
    return match


def collect_existing_hrefs(block_text: str) -> set[str]:
    return set(re.findall(r'href:\s*"([^"]+)"', block_text))


def build_entry(title: str, href: str, game_type: str) -> str:
    blurb = "New game."
    return (
        "      {\n"
        f'        title: "{title}",\n'
        f'        href: "{href}",\n'
        f'        blurb: "{blurb}",\n'
        "        tags: [],\n"
        f'        type: "{game_type}"\n'
        "      }"
    )


def main() -> int:
    if not INDEX_PATH.exists():
        print(f"Missing {INDEX_PATH}", file=sys.stderr)
        return 1

    index_text = INDEX_PATH.read_text(encoding="utf-8")
    match = find_games_block(index_text)
    if not match:
        print("Could not locate games list in index.html", file=sys.stderr)
        return 1

    block_text = match.group(2)
    existing_hrefs = collect_existing_hrefs(block_text)

    new_entries = []
    for folder, game_type in ((PLAYABLE_DIR, "playable"), (DEMOS_DIR, "demo")):
        if not folder.exists():
            continue
        for path in sorted(folder.glob("*.html")):
            href = f"{folder.name}/{path.name}"
            if href in existing_hrefs:
                continue
            title = load_title(path)
            new_entries.append(build_entry(title, href, game_type))

    if not new_entries:
        print("No new games found.")
        return 0

    new_block = block_text.rstrip()
    if new_block:
        if not new_block.endswith(","):
            new_block += ","
        new_block += "\n"
    new_block += "\n".join(new_entries)

    updated_text = index_text[: match.start(2)] + new_block + index_text[match.end(2) :]
    INDEX_PATH.write_text(updated_text, encoding="utf-8")
    print(f"Added {len(new_entries)} new game(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
