"""Fetch the chosen Not Boring Icons as SVG into figma-plugin/nbi-icons/raw/ and write the mapping.

MAP is Headroom's icon name -> Not Boring Icons name (None = not in their library yet).
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from nbi import Client, ROOT

MAP = {
 "arrow-down-left": "arrow-down-left", "arrow-left-right": "arrows-left-right", "arrow-right": "arrow-right", "arrow-up-right": "arrow-up-right",
 "ban": "ban", "battery-full": "battery-full", "bell": "bell-01", "briefcase": "briefcase", "bus": "bus", "calendar": "calendar-01",
 "calendar-check": "calendar-check", "check": "check", "chevron-down": "chevron-down", "chevron-left": "chevron-left", "chevron-right": "chevron-right",
 "chevron-up": "chevron-up", "chevrons-up": "chevrons-up", "circle-alert": "alert-circle", "circle-check": "check-circle", "circle-x": "x-circle",
 "clapperboard": "clapperboard", "clock": "clock", "cloud-off": "cloud-off", "coffee": "coffee", "contrast": "contrast", "credit-card": "credit-card",
 "delete": "delete", "download": "download", "ellipsis": "more", "ellipsis-vertical": "more-vertical", "equal": "equal", "eye": "eye", "eye-off": "eye-off",
 "gauge": "gauge", "gift": "gift", "graduation-cap": "graduation-cap", "hand-heart": None, "heart-pulse": "heart-pulse", "history": "history",
 "house": "home-01", "indian-rupee": "rupee", "info": "info", "landmark": "bank", "lightbulb": "lightbulb", "link-2-off": "link-off", "list": "list",
 "list-checks": "list-check", "lock": "lock-01", "log-in": "login", "menu": "menu", "party-popper": "party-popper", "pencil": "pencil",
 "piggy-bank": "piggy-bank", "plane": "plane", "play": "play", "plus": "plus", "receipt": "receipt", "refresh-cw": "refresh", "repeat": "repeat",
 "rotate-ccw": "undo", "ruler": "ruler", "scan-face": "scan-face", "scan-search": "scan-search", "search": "search-01", "search-x": "search-x",
 "share-2": "share-2", "shield": "shield", "shopping-bag": "shopping-bag", "shopping-basket": "basket", "signal": "signal", "signal-low": None,
 "sliders-horizontal": "sliders-horizontal", "split": None, "store": "store", "table": "table", "tag": "tag", "target": "target", "trash-2": "trash",
 "tree-palm": None, "triangle-alert": "alert", "users": "users", "utensils": "utensils", "wallet": "wallet", "wifi": "wifi", "wifi-off": "wifi-off",
 "x": "close", "zap": "zap",
}
# Not in the library yet: closest stand-ins used until the Not Boring Icons team adds real ones
STANDIN = {"hand-heart": "heart", "signal-low": "wifi-low", "split": "divide", "tree-palm": "sun"}
c = Client().start()
raw = ROOT / "figma-plugin" / "nbi-icons" / "raw"; raw.mkdir(parents=True, exist_ok=True)
want = sorted({v for v in MAP.values() if v} | set(STANDIN.values()))
got, failed = {}, []
for i in range(0, len(want), 30):
    batch = want[i:i + 30]
    res = c.call("get_icons", {"names": batch, "style": "stroke", "format": "svg"})
    txt = "\n".join(p.get("text", "") for p in (res or {}).get("content", []))
    # accept either JSON {name: svg} / [{name, svg}] or concatenated <svg> blocks in order
    parsed = None
    try:
        parsed = json.loads(txt)
    except json.JSONDecodeError:
        pass
    if isinstance(parsed, dict):
        items = parsed.get("icons", parsed)
        items = items if isinstance(items, list) else [{"name": k, "svg": v} for k, v in items.items()]
    elif isinstance(parsed, list):
        items = parsed
    else:
        # "// name\n<svg ...>...</svg>" repeated
        items = [{"name": n.strip(), "svg": b} for n, b in re.findall(r"//\s*([a-z0-9-]+)\s*\n\s*(<svg[\s\S]*?</svg>)", txt)]
        if not items:
            print("UNPARSED BATCH:", txt[:500])
        notes = [l for l in txt.splitlines() if l.strip() and not l.strip().startswith(("//", "<"))]
        if notes:
            print("server notes:", " | ".join(notes)[:400])
    for it in items:
        name = it.get("name"); svg = it.get("svg") or it.get("code") or it.get("content") or ""
        if name and "<svg" in svg:
            (raw / f"{name}.svg").write_text(svg, encoding="utf-8"); got[name] = True
for n in want:
    if n not in got:
        failed.append(n)
missing = sorted([k for k, v in MAP.items() if not v])
(ROOT / "figma-plugin" / "nbi-icons" / "map.json").write_text(json.dumps({"map": MAP, "standIn": STANDIN, "fetchFailed": failed, "missing": missing}, indent=1), encoding="utf-8")
print(f"fetched {len(got)}/{len(want)} · failed: {failed} · not in library: {missing}")
