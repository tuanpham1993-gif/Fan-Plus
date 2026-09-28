"""Time rules for events.

Event start_time / end_time are stored as naive Asia/Ho_Chi_Minh wall-clock
time (the seed data already follows this). The API always emits them with an
explicit +07:00 offset, and accepts either an offset-aware ISO string (converted
to Vietnam time) or a naive one (assumed to already be Vietnam time).

created_at / updated_at are naive UTC and are emitted with a Z suffix.
"""

from datetime import date, datetime, timedelta, timezone

VN_TZ = timezone(timedelta(hours=7), "Asia/Ho_Chi_Minh")


def now_vn():
    return datetime.now(VN_TZ).replace(tzinfo=None)


def parse_event_datetime(value):
    """Parse an ISO string into naive Vietnam wall-clock time (None when empty)."""
    if value is None or str(value).strip() == "":
        return None
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(VN_TZ).replace(tzinfo=None)
    return parsed.replace(microsecond=0)


def parse_vn_date(value):
    """Parse a YYYY-MM-DD filter value (None when empty)."""
    if value is None or str(value).strip() == "":
        return None
    return date.fromisoformat(str(value).strip())


def day_start(day):
    return datetime(day.year, day.month, day.day)


def vn_iso(value):
    if value is None:
        return None
    return value.replace(tzinfo=VN_TZ).isoformat()


def utc_iso(value):
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
