# Chem Lab — 4-week OSS marketing sprint

20 min/day via [ntfy.sh/chemistry](https://ntfy.sh/chemistry). Two 10-min pings.

| | |
|--|--|
| Start | `config.json` → `start_date` (default **2026-07-24**) |
| Weekdays | 13:00 + 18:30 IST |
| Weekends | 00:30 + 00:45 IST |
| Skill | `.cursor/skills/chemlab-oss-marketing/` |
| Tasks | `tasks.json` (56 entries) |

## Phone

Subscribe to topic **`chemistry`** in the ntfy app (or open https://ntfy.sh/chemistry).

## Install reminders (macOS)

```bash
chmod +x marketing/oss-sprint/*.sh
cp marketing/oss-sprint/launchd/com.chemlab.ntfy.plist ~/Library/LaunchAgents/
launchctl unload ~/Library/LaunchAgents/com.chemlab.ntfy.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.chemlab.ntfy.plist
```

Mac clock timezone should be **Asia/Kolkata**.

## Manual / smoke test

```bash
./marketing/oss-sprint/dispatch.sh --day 1 --force a
./marketing/oss-sprint/dispatch.sh --dry-run --day 8 a
```

When a ping arrives, tell Cursor: **do today's ntfy**
