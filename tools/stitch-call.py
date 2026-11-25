#!/usr/bin/env python3
"""Call a Stitch MCP tool. Usage: python3 tools/stitch-call.py <tool> '<json-args>'"""
import json
import os
import sys
import urllib.request

KEY = os.environ["STITCH_API_KEY"]
URL = "https://stitch.googleapis.com/mcp"

def call(tool, args):
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {"name": tool, "arguments": args},
    }
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": KEY,
        },
    )
    with urllib.request.urlopen(req, timeout=300) as res:
        body = json.loads(res.read())
    if "error" in body:
        raise SystemExit(f"MCP error: {json.dumps(body['error'])[:2000]}")
    result = body["result"]
    for c in result.get("content", []):
        if c.get("type") == "text":
            try:
                parsed = json.loads(c["text"])
                return parsed
            except Exception:
                return c["text"]
    return result

if __name__ == "__main__":
    tool = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    out = call(tool, args)
    print(json.dumps(out, indent=1) if not isinstance(out, str) else out)
