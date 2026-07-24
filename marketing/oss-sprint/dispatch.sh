#!/usr/bin/env bash
# Dispatch today's Alyra Labs OSS sprint task to ntfy.
# Usage:
#   ./dispatch.sh a|b
#   ./dispatch.sh --force a|b
#   ./dispatch.sh --day N --force a|b
#   ./dispatch.sh --dry-run a
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$DIR/config.json"
TASKS="$DIR/tasks.json"
LOG="$DIR/sent.log"
STATE="$DIR/state.json"
SEND="$DIR/send-ntfy.sh"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

SLOT=""
FORCE=0
DRY=0
DAY_OVERRIDE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --force) FORCE=1; shift ;;
    --dry-run) DRY=1; shift ;;
    --day)
      DAY_OVERRIDE="$2"
      shift 2
      ;;
    a|b|A|B)
      SLOT="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')"
      shift
      ;;
    *)
      echo "Unknown arg: $1" >&2
      echo "Usage: $0 [--force] [--dry-run] [--day N] a|b" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$SLOT" ]]; then
  echo "Usage: $0 [--force] [--dry-run] [--day N] a|b" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 required" >&2
  exit 1
fi

FORCE="$FORCE" DAY_OVERRIDE="$DAY_OVERRIDE" SLOT="$SLOT" \
CONFIG="$CONFIG" TASKS="$TASKS" OUT="$TMP" python3 <<'PY'
import json, os
from datetime import datetime, date
from zoneinfo import ZoneInfo

with open(os.environ["CONFIG"]) as f:
    cfg = json.load(f)
with open(os.environ["TASKS"]) as f:
    data = json.load(f)

tz = ZoneInfo(cfg.get("timezone", "Asia/Kolkata"))
now = datetime.now(tz)
today = now.date()
start = date.fromisoformat(cfg["start_date"])
slot = os.environ["SLOT"]
day_override = os.environ.get("DAY_OVERRIDE") or ""

if day_override:
    day_num = int(day_override)
else:
    day_num = (today - start).days + 1

if day_num < 1:
    result = {"skip": True, "reason": f"Before start_date {start.isoformat()} (day would be {day_num})"}
elif day_num > 28:
    result = {"skip": True, "reason": f"Sprint finished (day {day_num} > 28)"}
else:
    task = next((t for t in data["tasks"] if t["day"] == day_num and t["slot"] == slot), None)
    if not task:
        result = {"skip": True, "reason": f"No task for day {day_num} slot {slot}"}
    else:
        result = {
            "skip": False,
            "day": day_num,
            "slot": slot,
            "title": task["title"],
            "body": task["body"],
            "done_hint": task.get("done_hint"),
            "copy_file": task.get("copy_file"),
            "ntfy_url": cfg.get("ntfy_url", "https://ntfy.sh/chemistry"),
            "ist_now": now.isoformat(timespec="minutes"),
            "is_weekend": today.weekday() >= 5,
        }

with open(os.environ["OUT"], "w") as f:
    json.dump(result, f)
PY

SKIP="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("skip", False))' "$TMP")"
if [[ "$SKIP" == "True" ]]; then
  REASON="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("reason",""))' "$TMP")"
  echo "skip: $REASON"
  exit 0
fi

TITLE="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["title"])' "$TMP")"
BODY="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["body"])' "$TMP")"
DAY="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["day"])' "$TMP")"
NTFY_URL="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ntfy_url"])' "$TMP")"

echo "Day $DAY slot $SLOT → $TITLE"

if [[ "$DRY" -eq 1 ]]; then
  echo "--- dry-run ---"
  printf '%s\n\n%s\n' "$TITLE" "$BODY"
  exit 0
fi

export NTFY_URL
HTTP_CODE="$("$SEND" "$TITLE" "$BODY" "default" "test_tube,alarm_clock")"
echo "ntfy HTTP $HTTP_CODE"

TS="$(TZ=Asia/Kolkata date -Iseconds)"
echo "$TS day=$DAY slot=$SLOT title=$TITLE http=$HTTP_CODE" >>"$LOG"

STATE="$STATE" TMP="$TMP" python3 <<'PY'
import json, os
from datetime import datetime
from zoneinfo import ZoneInfo
payload = json.load(open(os.environ["TMP"]))
state = {
    "last_day": payload["day"],
    "last_slot": payload["slot"],
    "last_title": payload["title"],
    "last_sent_at": datetime.now(ZoneInfo("Asia/Kolkata")).isoformat(timespec="seconds"),
    "done_hint": payload.get("done_hint"),
    "copy_file": payload.get("copy_file"),
}
path = os.environ["STATE"]
with open(path, "w") as f:
    json.dump(state, f, indent=2)
    f.write("\n")
print(f"Wrote {path}")
PY
