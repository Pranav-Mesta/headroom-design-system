"""Search Not Boring Icons for every icon Headroom uses; write candidates to figma-plugin/nbi-icons/candidates.json."""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from nbi import Client, ROOT

NEED = [l.split("`")[1] for l in (ROOT / "docs" / "icon-inventory.md").read_text(encoding="utf-8").splitlines() if l.startswith("| `")]
# plain-language queries; several per icon, first is the primary meaning
Q = {
 "arrow-down-left": ["arrow down left", "income arrow"], "arrow-left-right": ["arrows left right", "transfer", "swap"], "arrow-right": ["arrow right"],
 "arrow-up-right": ["arrow up right", "expense arrow"], "ban": ["ban", "prohibited", "block"], "battery-full": ["battery full", "battery"],
 "bell": ["bell", "notification"], "briefcase": ["briefcase", "work", "salary"], "bus": ["bus", "transport"], "calendar": ["calendar"],
 "calendar-check": ["calendar check", "calendar done"], "check": ["check", "tick"], "chevron-down": ["chevron down"], "chevron-left": ["chevron left", "back"],
 "chevron-right": ["chevron right"], "chevron-up": ["chevron up"], "chevrons-up": ["chevrons up", "double chevron up"], "circle-alert": ["alert circle", "error circle"],
 "circle-check": ["check circle", "success"], "circle-x": ["x circle", "close circle", "clear"], "clapperboard": ["clapperboard", "movie", "film"],
 "clock": ["clock", "time"], "cloud-off": ["cloud off", "offline cloud"], "coffee": ["coffee", "cafe"], "contrast": ["contrast"], "credit-card": ["credit card", "card"],
 "delete": ["backspace", "delete key"], "download": ["download"], "ellipsis": ["more horizontal", "dots horizontal", "ellipsis"],
 "ellipsis-vertical": ["more vertical", "dots vertical"], "equal": ["equal", "equals"], "eye": ["eye", "show", "view"], "eye-off": ["eye off", "hide", "eye slash"],
 "gauge": ["gauge", "speedometer", "meter"], "gift": ["gift", "present"], "graduation-cap": ["graduation cap", "education"], "hand-heart": ["hand heart", "care", "support"],
 "heart-pulse": ["heart pulse", "health"], "history": ["history", "recent"], "house": ["home", "house"], "indian-rupee": ["rupee", "indian rupee", "currency"],
 "info": ["info", "information"], "landmark": ["bank", "landmark"], "lightbulb": ["lightbulb", "idea", "insight"], "link-2-off": ["link off", "unlink", "disconnect"],
 "list": ["list"], "list-checks": ["list checks", "checklist", "select"], "lock": ["lock"], "log-in": ["log in", "sign in", "enter"], "menu": ["menu", "hamburger"],
 "party-popper": ["party popper", "celebration", "confetti"], "pencil": ["pencil", "edit"], "piggy-bank": ["piggy bank", "savings"], "plane": ["plane", "travel", "flight"],
 "play": ["play"], "plus": ["plus", "add"], "receipt": ["receipt", "bill"], "refresh-cw": ["refresh", "sync", "reload"], "repeat": ["repeat", "recurring", "loop"],
 "rotate-ccw": ["rotate counter clockwise", "undo", "refund"], "ruler": ["ruler", "measure"], "scan-face": ["face id", "scan face", "face recognition"],
 "scan-search": ["scan search", "inspect", "audit"], "search": ["search", "magnifier"], "search-x": ["search x", "no results", "search off"], "share-2": ["share"],
 "shield": ["shield", "security", "protection"], "shopping-bag": ["shopping bag", "shopping"], "shopping-basket": ["basket", "groceries", "shopping basket"],
 "signal": ["signal", "cellular"], "signal-low": ["signal low", "weak signal"], "sliders-horizontal": ["sliders", "filters", "settings sliders"],
 "split": ["split", "divide"], "store": ["store", "shop", "merchant"], "table": ["table", "grid table"], "tag": ["tag", "label"], "target": ["target", "goal"],
 "trash-2": ["trash", "delete"], "tree-palm": ["palm tree", "beach", "vacation"], "triangle-alert": ["warning", "alert triangle"], "users": ["users", "people", "group"],
 "utensils": ["utensils", "fork knife", "food", "restaurant"], "wallet": ["wallet"], "wifi": ["wifi", "wireless"], "wifi-off": ["wifi off", "no wifi", "offline"],
 "x": ["x", "close", "cross"], "zap": ["zap", "lightning", "electricity", "bills"],
}
c = Client().start()
out = {}
for n in NEED:
    seen, cands = set(), []
    for q in Q.get(n, [n.replace("-", " ")]):
        res = c.call("search_icons", {"query": q, "limit": 8})
        txt = "".join(p.get("text", "") for p in (res or {}).get("content", []))
        try:
            icons = json.loads(txt).get("icons", [])
        except json.JSONDecodeError:
            icons = []
        for i in icons:
            if i["name"] not in seen:
                seen.add(i["name"]); cands.append({"name": i["name"], "category": i.get("category"), "tags": i.get("tags", ""), "q": q})
    out[n] = cands
    print(f"{n:22} -> {', '.join(x['name'] for x in cands[:6]) or '(none)'}")
d = ROOT / "figma-plugin" / "nbi-icons"; d.mkdir(parents=True, exist_ok=True)
(d / "candidates.json").write_text(json.dumps(out, indent=1), encoding="utf-8")
