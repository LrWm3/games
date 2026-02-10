#!/usr/bin/env python3
import html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path


INDEX_PATH = Path("site/games/index.html")
PLAYABLE_DIR = Path("site/games/playable")
DEMOS_DIR = Path("site/games/demos")


class GameMetaParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_title = False
        self.title_parts: list[str] = []
        self.meta: dict[str, str] = {}

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if tag == "title":
            self.in_title = True
            return
        if tag != "meta":
            return
        attr_map = {key.lower(): value or "" for key, value in attrs if key}
        name = attr_map.get("name", "").lower()
        if name in ("game-description", "game-tags"):
            self.meta[name] = attr_map.get("content", "")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)


def parse_game_page(path: Path) -> tuple[str, str, list[str]]:
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except OSError:
        fallback_title = path.stem.replace("-", " ").replace("_", " ").title()
        return fallback_title, "New game.", []
    parser = GameMetaParser()
    parser.feed(text)
    raw_title = html.unescape("".join(parser.title_parts))
    title = re.sub(r"\s+", " ", raw_title).strip()
    if not title:
        title = path.stem.replace("-", " ").replace("_", " ").title()
    raw_description = html.unescape(parser.meta.get("game-description", ""))
    description = re.sub(r"\s+", " ", raw_description).strip() or "New game."
    raw_tags = parser.meta.get("game-tags", "")
    tags = [tag.strip().lower() for tag in raw_tags.split(",") if tag.strip()]
    return title, description, tags


def find_games_block(text: str):
    pattern = re.compile(r"(const games = \[)(.*?)(\n\s*\];)", re.DOTALL)
    match = pattern.search(text)
    if not match:
        return None
    return match


def js_string(value: str) -> str:
    cleaned = re.sub(r"\s+", " ", value).strip()
    cleaned = cleaned.replace("\\", "\\\\").replace('"', '\\"')
    return cleaned


def build_entry(title: str, href: str, blurb: str, tags: list[str], game_type: str) -> str:
    tag_list = ", ".join(f'"{js_string(tag)}"' for tag in tags)
    tag_value = f"[{tag_list}]" if tags else "[]"
    return (
        "      {\n"
        f'        title: "{js_string(title)}",\n'
        f'        href: "{js_string(href)}",\n'
        f'        blurb: "{js_string(blurb)}",\n'
        f"        tags: {tag_value},\n"
        f'        type: "{game_type}"\n'
        "      },"
    )


def parse_existing_games(block_text: str) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    for index, match in enumerate(re.finditer(r"\{\s*.*?\s*\},", block_text, re.DOTALL)):
        chunk = match.group(0)
        href_match = re.search(r'href:\s*"([^"]+)"', chunk)
        if not href_match:
            continue
        href = href_match.group(1)
        tags_match = re.search(r"tags:\s*\[(.*?)\]", chunk, re.DOTALL)
        tags: list[str] = []
        if tags_match:
            tags = [tag.strip() for tag in re.findall(r'"([^"]+)"', tags_match.group(1))]
        type_match = re.search(r'type:\s*"([^"]+)"', chunk)
        game_type = type_match.group(1) if type_match else ""
        entries.append({"href": href, "tags": tags, "type": game_type, "order": index})
    return entries


def main() -> int:
    if not INDEX_PATH.exists():
        print(f"Missing {INDEX_PATH}", file=sys.stderr)
        return 1

    index_text = INDEX_PATH.read_text(encoding="utf-8")
    match = find_games_block(index_text)
    if not match:
        print("Could not locate games list in index.html", file=sys.stderr)
        return 1

    entries: list[dict[str, object]] = []
    for folder, game_type in ((PLAYABLE_DIR, "playable"), (DEMOS_DIR, "demo")):
        if not folder.exists():
            continue
        for path in sorted(folder.glob("*.html")):
            if "reply-all" in path.name:
                continue
            href = f"{folder.name}/{path.name}"
            title, blurb, tags = parse_game_page(path)
            entries.append(
                {
                    "href": href,
                    "title": title,
                    "blurb": blurb,
                    "tags": tags,
                    "type": game_type,
                }
            )

    if not entries:
        print("No games found.")
        return 0

    existing_entries = parse_existing_games(match.group(2))
    new_by_href = {entry["href"]: entry for entry in entries}
    used: set[str] = set()
    ordered_entries: list[str] = []

    for existing in existing_entries:
        href = str(existing["href"])
        updated = new_by_href.get(href)
        if not updated:
            continue
        existing_tags = sorted(str(tag) for tag in existing.get("tags", []))
        updated_tags = sorted(str(tag) for tag in updated.get("tags", []))
        if existing_tags == updated_tags and existing.get("type") == updated.get("type"):
            ordered_entries.append(
                build_entry(
                    str(updated["title"]),
                    href,
                    str(updated["blurb"]),
                    list(updated["tags"]),
                    str(updated["type"]),
                )
            )
            used.add(href)

    for entry in entries:
        href = str(entry["href"])
        if href in used:
            continue
        ordered_entries.append(
            build_entry(
                str(entry["title"]),
                href,
                str(entry["blurb"]),
                list(entry["tags"]),
                str(entry["type"]),
            )
        )

    new_block = "\n" + "\n".join(ordered_entries)

    updated_text = index_text[: match.start(2)] + new_block + index_text[match.end(2) :]
    INDEX_PATH.write_text(updated_text, encoding="utf-8")
    print(f"Updated {len(entries)} game(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
