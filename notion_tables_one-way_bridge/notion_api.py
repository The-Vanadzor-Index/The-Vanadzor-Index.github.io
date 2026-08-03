"""Minimal Notion REST client and property conversion, shared by the sync scripts.

Standard library only, so the pipeline runs on a plain Python with nothing installed
(except parse_site.py, which needs beautifulsoup4).
"""
import json
import time
import urllib.error
import urllib.request

import config


def api(url, payload=None, method="GET"):
    """Call the Notion API, backing off on rate limits rather than dropping writes."""
    for attempt in range(6):
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode() if payload is not None else None,
            headers=config.headers(),
            method=method,
        )
        try:
            return json.loads(urllib.request.urlopen(req, timeout=60).read())
        except urllib.error.HTTPError as e:
            # Notion allows roughly 3 requests/second.
            if e.code in (429, 502, 503):
                time.sleep(float(e.headers.get("Retry-After", 1)) * (attempt + 1))
                continue
            body = e.read().decode("utf-8", "replace")[:500]
            raise SystemExit(f"HTTP {e.code} on {method} {url}\n{body}")
    raise SystemExit(f"gave up after retries: {url}")


def query_all(db):
    """Every page in a database, following pagination."""
    out, cursor = [], None
    while True:
        body = {"page_size": 100}
        if cursor:
            body["start_cursor"] = cursor
        data = api(f"https://api.notion.com/v1/databases/{db}/query", body, "POST")
        out += data["results"]
        if not data.get("has_more"):
            break
        cursor = data["next_cursor"]
    return out


def read(prop):
    """Notion property -> plain string, in the same shape the CSV uses."""
    t = prop["type"]
    if t == "multi_select":
        return ", ".join(o["name"] for o in prop["multi_select"])
    if t == "select":
        return (prop["select"] or {}).get("name") or ""
    if t in ("rich_text", "title"):
        return "".join(x["plain_text"] for x in prop[t])
    if t == "checkbox":
        # the Notion CSV export writes an unchecked box as "No", not as empty
        return "Yes" if prop["checkbox"] else "No"
    return prop.get(t) or ""


def write(ptype, value):
    """Plain string -> Notion property payload."""
    v = (value or "").strip()
    if ptype == "multi_select":
        return {"multi_select": [{"name": s.strip()} for s in v.split(",") if s.strip()]}
    if ptype == "select":
        return {"select": {"name": v} if v else None}
    if ptype == "rich_text":
        return {"rich_text": [{"text": {"content": v}}] if v else []}
    if ptype == "title":
        return {"title": [{"text": {"content": v}}] if v else []}
    if ptype == "checkbox":
        return {"checkbox": v.lower() in ("yes", "true", "1")}
    if ptype == "phone_number":
        return {"phone_number": v or None}
    if ptype == "url":
        return {"url": v or None}
    raise ValueError(f"unsupported property type: {ptype}")


def same(ptype, a, b):
    """Compare a CSV value with a live value, ignoring differences that carry no meaning."""
    a, b = (a or "").strip(), (str(b or "")).strip()
    if ptype == "checkbox":
        truthy = ("yes", "true", "1")
        return (a.lower() in truthy) == (b.lower() in truthy)
    if ptype == "multi_select":
        split = lambda s: {x.strip() for x in s.split(",") if x.strip()}
        return split(a) == split(b)
    return a == b


def score(csv_row, live_props, cols):
    """How strongly a CSV row and a live row agree, for telling apart shared titles."""
    n = 0
    for c in cols:
        a = (csv_row.get(c) or "").strip()
        b = (live_props.get(c) or "").strip()
        if a and b and a == b:
            n += 1
        elif a != b:
            n -= 1
    return n
