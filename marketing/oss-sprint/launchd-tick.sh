#!/usr/bin/env bash
# Called by launchd. Picks slot from IST clock, then dispatches.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
SLOT_OVERRIDE="${1:-}"

if [[ -n "$SLOT_OVERRIDE" ]]; then
  exec "$DIR/dispatch.sh" --force "$SLOT_OVERRIDE"
fi

SLOT="$(TZ=Asia/Kolkata python3 - <<'PY'
from datetime import datetime
from zoneinfo import ZoneInfo
now = datetime.now(ZoneInfo("Asia/Kolkata"))
h, m = now.hour, now.minute
weekend = now.weekday() >= 5

def near(th, tm):
    return abs((h * 60 + m) - (th * 60 + tm)) <= 2

if weekend:
    if near(0, 30):
        print("a")
    elif near(0, 45):
        print("b")
    else:
        print("a" if m < 40 else "b")
else:
    if near(13, 0):
        print("a")
    elif near(18, 30):
        print("b")
    else:
        print("a" if h < 16 else "b")
PY
)"

exec "$DIR/dispatch.sh" --force "$SLOT"
