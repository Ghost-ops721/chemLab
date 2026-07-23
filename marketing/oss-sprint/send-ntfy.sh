#!/usr/bin/env bash
# Send one notification to ntfy.sh/chemistry
# Args: title body [priority] [tags]
set -euo pipefail

TOPIC_URL="${NTFY_URL:-https://ntfy.sh/chemistry}"
TITLE="${1:-Chem Lab}"
PRIORITY="${3:-default}"
TAGS="${4:-test_tube}"

BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT
# Body may contain newlines / quotes — always via file
if [[ $# -ge 2 ]]; then
  printf '%s' "$2" >"$BODY_FILE"
else
  printf '%s' "Do todays 10-min task." >"$BODY_FILE"
fi

python3 - "$TOPIC_URL" "$TITLE" "$PRIORITY" "$TAGS" "$BODY_FILE" <<'PY'
import sys, http.client
from urllib.parse import urlparse

url, title, priority, tags, body_path = sys.argv[1:6]
body = open(body_path, "rb").read()
parsed = urlparse(url)
conn_cls = http.client.HTTPSConnection if parsed.scheme == "https" else http.client.HTTPConnection
conn = conn_cls(parsed.hostname, parsed.port, timeout=30)
# Encode non-latin1 header chars (e.g. middle dot) as XML/unicode escapes for safety:
# ntfy accepts UTF-8 titles if we pass via query... use ASCII-safe title fallback
title_hdr = title.encode("utf-8").decode("latin-1")

headers = {
    "Title": title_hdr,
    "Priority": priority,
    "Tags": tags,
    "Content-Type": "text/plain; charset=utf-8",
}
conn.request("POST", parsed.path or "/", body=body, headers=headers)
resp = conn.getresponse()
print(resp.status)
conn.close()
PY
