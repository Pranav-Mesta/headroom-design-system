"""Minimal MCP-over-HTTP client for Not Boring Icons.

Reads NOT_BORING_ICONS_API_KEY from .env.local (never printed), then:
  python tools/nbi.py tools                     list the server's tools
  python tools/nbi.py call <tool> '<json args>' call a tool, print the result
"""
import json, pathlib, sys, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent

def env():
    vals = {}
    p = ROOT / ".env.local"
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                vals[k.strip()] = v.strip().strip('"').strip("'")
    return vals

class Client:
    def __init__(self):
        e = env()
        self.url = e.get("NOT_BORING_ICONS_MCP_URL") or "https://www.notboringicons.com/api/mcp"
        self.key = e.get("NOT_BORING_ICONS_API_KEY", "")
        if not self.key:
            sys.exit("NOT_BORING_ICONS_API_KEY is empty in .env.local. Paste the key after the = sign and run again.")
        self.session = None
        self.n = 0

    def _post(self, payload, notify=False):
        headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream",
                   "Authorization": f"Bearer {self.key}", "User-Agent": "headroom-design-system/1.0"}
        if self.session:
            headers["Mcp-Session-Id"] = self.session
        req = urllib.request.Request(self.url, data=json.dumps(payload).encode(), headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                sid = r.headers.get("Mcp-Session-Id")
                if sid:
                    self.session = sid
                body = r.read().decode("utf-8", "replace")
                ctype = r.headers.get("Content-Type", "")
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "replace")[:400]
            sys.exit(f"HTTP {e.code} from server: {msg}")
        if notify or not body.strip():
            return None
        if "text/event-stream" in ctype:
            msgs = [json.loads(l[5:].strip()) for l in body.splitlines() if l.startswith("data:") and l[5:].strip()]
            msgs = [m for m in msgs if m.get("id") == payload.get("id")] or msgs
            return msgs[-1] if msgs else None
        return json.loads(body)

    def rpc(self, method, params=None):
        self.n += 1
        res = self._post({"jsonrpc": "2.0", "id": self.n, "method": method, "params": params or {}})
        if res and "error" in res:
            sys.exit(f"Server error on {method}: {json.dumps(res['error'])[:400]}")
        return (res or {}).get("result")

    def start(self):
        self.rpc("initialize", {"protocolVersion": "2025-03-26", "capabilities": {},
                                "clientInfo": {"name": "headroom-design-system", "version": "1.0"}})
        self._post({"jsonrpc": "2.0", "method": "notifications/initialized"}, notify=True)
        return self

    def tools(self):
        return self.rpc("tools/list")["tools"]

    def call(self, name, args):
        return self.rpc("tools/call", {"name": name, "arguments": args})

if __name__ == "__main__":
    c = Client().start()
    if len(sys.argv) < 2 or sys.argv[1] == "tools":
        for t in c.tools():
            print(f"- {t['name']}: {t.get('description', '')[:300]}")
            print(f"  input: {json.dumps(t.get('inputSchema', {}).get('properties', {}))[:400]}")
    elif sys.argv[1] == "call":
        out = c.call(sys.argv[2], json.loads(sys.argv[3]) if len(sys.argv) > 3 else {})
        for part in (out or {}).get("content", []):
            print(part.get("text", json.dumps(part))[:6000])
