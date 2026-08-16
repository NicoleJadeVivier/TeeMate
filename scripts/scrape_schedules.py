#!/usr/bin/env python3
"""Scrapes PGA Tour / Korn Ferry / PGA Tour Americas / Q-School schedules and
writes a SQL seed file for the `tournaments` table. Run the output in the
Supabase SQL editor.

Usage:
    python3 scripts/scrape_schedules.py [--out supabase/seed_tournaments.sql]

The output upserts on (name, tour, start_date) instead of deleting and
reinserting, so existing tournament rows — and any posts/comments/
commitments attached to them — survive re-running this.

The pgatour.com tour sites render their schedule client-side, but the data
used for that render ships embedded in the page as a Next.js __NEXT_DATA__
JSON blob (under props.pageProps.dehydratedState.queries), so a plain HTTP
GET + JSON parse is enough for those three — no browser automation needed.

Q-School lives on a separate, plain server-rendered site
(qualifying.pgatourhq.com) with the schedule as a set of HTML tables, one per
stage, so that one is parsed directly out of the markup instead.
"""

import argparse
import html as html_lib
import json
import re
import sys
from datetime import datetime

import requests

SOURCES = [
    ("https://www.pgatour.com/schedule", "PGA"),
    ("https://www.pgatour.com/korn-ferry-tour/schedule", "Korn Ferry"),
    ("https://www.pgatour.com/americas/schedule", "Americas"),
]

QSCHOOL_URL = "https://qualifying.pgatourhq.com/q-school"

QSCHOOL_STAGE_HEADERS = {
    "PRE-QUALIFYING STAGE": "Pre-Qualifying",
    "FIRST STAGE": "First Stage",
    "SECOND STAGE": "Second Stage",
    "FINAL STAGE": "Final Stage",
}

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
    )
}

NEXT_DATA_RE = re.compile(
    r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', re.S
)


def fetch_tournaments(url: str) -> list[dict]:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    match = NEXT_DATA_RE.search(resp.text)
    if not match:
        raise RuntimeError(f"Could not find __NEXT_DATA__ on {url}")

    data = json.loads(match.group(1))
    queries = data["props"]["pageProps"]["dehydratedState"]["queries"]
    schedule_queries = [q for q in queries if q["queryKey"][0] == "schedule"]
    if not schedule_queries:
        raise RuntimeError(f"Could not find a schedule query on {url}")

    return schedule_queries[0]["state"]["data"]["tournaments"]


def parse_dates(month: str, year: str, display_date: str):
    """"Jan 15 - 18" / "Jan 29 - Feb 1" / "Dec 29 - Jan 1" -> (start date, end date)."""
    parts = [p.strip() for p in display_date.split(" - ")]
    if len(parts) != 2:
        return None, None

    start_part, end_part = parts
    year = int(year)

    try:
        start_dt = datetime.strptime(f"{start_part} {year}", "%b %d %Y")
    except ValueError:
        return None, None

    if end_part.isdigit():
        end_part = f"{start_part.split()[0]} {end_part}"

    try:
        end_dt = datetime.strptime(f"{end_part} {year}", "%b %d %Y")
    except ValueError:
        return None, None

    if end_dt < start_dt:
        end_dt = end_dt.replace(year=year + 1)

    return start_dt.date(), end_dt.date()


def build_location(course_data: dict | None) -> str:
    if not course_data:
        return ""
    city = (course_data.get("city") or "").strip()
    country = (course_data.get("country") or "").strip()
    state = (course_data.get("stateCode") or "").strip()

    if country == "United States of America":
        parts = [p for p in (city, state) if p]
    else:
        parts = [p for p in (city, country) if p]
    return ", ".join(parts)


def clean_html_text(fragment: str) -> str:
    text = re.sub(r"<[^>]+>", " ", fragment)
    text = html_lib.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def parse_qschool_date_range(text: str):
    """"September 16-18, 2026" / "September 30-October 2, 2026" -> (start, end)."""
    match = re.match(
        r"^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(?:([A-Za-z]+)\s+)?(\d{1,2}),\s*(\d{4})$",
        text.strip(),
    )
    if not match:
        return None, None

    month1, day1, month2, day2, year = match.groups()
    month2 = month2 or month1
    year = int(year)

    try:
        start_dt = datetime.strptime(f"{month1} {day1} {year}", "%B %d %Y")
        end_dt = datetime.strptime(f"{month2} {day2} {year}", "%B %d %Y")
    except ValueError:
        return None, None

    if end_dt < start_dt:
        end_dt = end_dt.replace(year=year + 1)

    return start_dt.date(), end_dt.date()


def fetch_qschool_tournaments() -> list[dict]:
    resp = requests.get(QSCHOOL_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()

    tables = re.findall(r"<table.*?</table>", resp.text, re.S)
    results = []

    for table in tables:
        rows = re.findall(r"<tr>(.*?)</tr>", table, re.S)
        if not rows:
            continue

        header_text = clean_html_text(rows[0]).upper()
        stage = next(
            (label for key, label in QSCHOOL_STAGE_HEADERS.items() if key in header_text),
            None,
        )
        if not stage:
            continue

        current_date_text = None
        for row in rows[1:]:
            cells = re.findall(r"<td[^>]*>(.*?)</td>", row, re.S)
            if len(cells) < 3:
                continue

            date_cell = clean_html_text(cells[0])
            course = clean_html_text(cells[1])
            location = clean_html_text(cells[2])

            if date_cell and not date_cell.lower().startswith("(practice"):
                current_date_text = date_cell

            if not course or not current_date_text:
                continue

            start, end = parse_qschool_date_range(current_date_text)
            if not start or not end:
                continue

            results.append(
                {
                    "name": course,
                    "location": location,
                    "start_date": start.isoformat(),
                    "end_date": end.isoformat(),
                    "stage": stage,
                }
            )

    return merge_final_stage(results)


def merge_final_stage(results: list[dict]) -> list[dict]:
    """Unlike the other stages, Final Stage is one field split across a host
    course and a remote overflow course, not separate simultaneous
    tournaments, so collapse same-date Final Stage rows into a single entry.
    """
    merged = []
    groups: dict[tuple[str, str], dict] = {}

    for r in results:
        if r["stage"] != "Final Stage":
            merged.append(r)
            continue

        key = (r["start_date"], r["end_date"])
        group = groups.setdefault(
            key,
            {"names": [], "locations": [], "start_date": r["start_date"], "end_date": r["end_date"]},
        )
        group["names"].append(r["name"])
        if r["location"] not in group["locations"]:
            group["locations"].append(r["location"])

    for group in groups.values():
        merged.append(
            {
                "name": " & ".join(group["names"]),
                "location": " / ".join(group["locations"]),
                "start_date": group["start_date"],
                "end_date": group["end_date"],
                "stage": "Final Stage",
            }
        )

    return merged


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def sql_value_or_null(value: str | None) -> str:
    return f"'{sql_escape(value)}'" if value else "null"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out", default="supabase/seed_tournaments.sql", help="Output SQL file path"
    )
    args = parser.parse_args()

    rows = []
    skipped = 0

    for url, tour_name in SOURCES:
        print(f"Fetching {tour_name} schedule from {url} ...", file=sys.stderr)
        tournaments = fetch_tournaments(url)
        for t in tournaments:
            start, end = parse_dates(t.get("month", ""), t.get("year", ""), t.get("displayDate", ""))
            if not start or not end:
                skipped += 1
                print(f"  skipping (unparseable date): {t.get('name')!r}", file=sys.stderr)
                continue

            location = build_location(t.get("courseData"))
            rows.append((t["name"], tour_name, location, start.isoformat(), end.isoformat(), None))
        print(f"  {len(tournaments)} tournaments found", file=sys.stderr)

    print(f"Fetching Q-School schedule from {QSCHOOL_URL} ...", file=sys.stderr)
    qschool_tournaments = fetch_qschool_tournaments()
    for t in qschool_tournaments:
        rows.append(
            (t["name"], "Q-School", t["location"], t["start_date"], t["end_date"], t["stage"])
        )
    print(f"  {len(qschool_tournaments)} Q-School sites found", file=sys.stderr)

    if not rows:
        print("No tournaments scraped — aborting without writing a file.", file=sys.stderr)
        sys.exit(1)

    lines = [
        "-- Generated by scripts/scrape_schedules.py",
        "-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).",
        "--",
        "-- Upserts on (name, tour, start_date) rather than deleting and",
        "-- reinserting, so existing tournament rows keep their id. Deleting a",
        "-- tournament cascades to delete any posts/comments/commitments",
        "-- attached to it, which a delete-then-insert refresh would otherwise",
        "-- silently wipe out.",
        "",
    ]

    lines.append("insert into tournaments (name, tour, location, start_date, end_date, stage) values")
    value_lines = [
        f"  ('{sql_escape(name)}', '{tour}', '{sql_escape(location)}', '{start}', '{end}', {sql_value_or_null(stage)})"
        for name, tour, location, start, end, stage in rows
    ]
    lines.append(",\n".join(value_lines))
    lines.append(
        "on conflict (name, tour, start_date) do update set\n"
        "  location = excluded.location,\n"
        "  end_date = excluded.end_date,\n"
        "  stage = excluded.stage;"
    )
    lines.append("")

    with open(args.out, "w") as f:
        f.write("\n".join(lines))

    print(f"\nWrote {len(rows)} tournaments to {args.out} ({skipped} skipped).", file=sys.stderr)


if __name__ == "__main__":
    main()
