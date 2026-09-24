from datetime import datetime,timedelta,timezone
import pytest
from pydantic import ValidationError
from app.schemas.requests import EventInput,EventQuery,RatingInput,RegisterInput,ResourceInput,DecisionInput,SearchQuery,SubmissionInput
from app.services import events

def event_payload(**overrides):
    start=datetime.now(timezone.utc)+timedelta(days=10)
    return EventInput(**({"title":"An original fan meetup","summary":"A fictional event used for testing.","category_id":"anime","city":"Test City","venue":"Example Hall","latitude":10.0,"longitude":106.0,"starts_at":start.isoformat(),"ends_at":(start+timedelta(hours=2)).isoformat()}|overrides))

@pytest.mark.parametrize("value",[0,6,1.2,True,"5"])
def test_rating_input_strict(value):
    with pytest.raises(ValidationError):RatingInput(value=value)

def test_role_mass_assignment_rejected():
    with pytest.raises(ValidationError):RegisterInput(email="a@b.example",display_name="Alice",password="TestPassword!26",role="admin")

def test_blank_name_rejected():
    with pytest.raises(ValidationError):RegisterInput(email="a@b.example",display_name="   ",password="TestPassword!26")

@pytest.mark.parametrize("key,value",[("latitude",91),("longitude",181),("latitude",float("nan")),("ticket_url","javascript:alert(1)"),("ticket_url","https://user:pass@example.com"),("timezone_name","Bad/Timezone"),("starts_at","2026-10-01T10:00:00")])
def test_event_validation(key,value):
    with pytest.raises(ValidationError):event_payload(**{key:value})

def test_time_order():
    with pytest.raises(ValidationError):event_payload(starts_at="2026-10-01T10:00:00+07:00",ends_at="2026-10-01T09:00:00+07:00")

def test_coordinate_pair():
    with pytest.raises(ValidationError):EventQuery(latitude=10)

def test_page_limit():
    with pytest.raises(ValidationError):SearchQuery(page_size=51)

def test_rejection_feedback_required():
    with pytest.raises(ValidationError):DecisionInput(decision="reject",expected_version=1)

def test_ownership_required():
    with pytest.raises(ValidationError):SubmissionInput(title="My story",category_id="anime",body_markdown="x"*100,ownership_confirmed=False)

def test_haversine_sanity():
    assert events.haversine(0,0,0,0)==0
    assert events.haversine(0,0,0,1)==pytest.approx(111.195,rel=0.001)
    assert events.haversine(0,179.9,0,-179.9)<23

def test_event_radius_before_pagination(db,people):
    for i,lng in enumerate([106.5,106.02,106.01,106.7]):
        events.create_event(db,people["admin"],event_payload(title=f"Event {i}",longitude=lng))
    db.commit()
    first,meta=events.nearby_events(db,EventQuery(latitude=10,longitude=106,radius_km=5,page_size=1))
    second,_=events.nearby_events(db,EventQuery(latitude=10,longitude=106,radius_km=5,page_size=1,page=2))
    assert meta["total"]==2 and meta["total_pages"]==2
    assert first[0]["distance_km"]<second[0]["distance_km"]

def test_dateline_nearby(db,people):
    item=events.create_event(db,people["admin"],event_payload(latitude=0,longitude=-179.9));db.commit()
    results,meta=events.nearby_events(db,EventQuery(latitude=0,longitude=179.9,radius_km=30))
    assert meta["total"]==1 and results[0]["id"]==item["id"]

def test_ics_escape_folding_and_utc(db,people):
    item=events.create_event(db,people["admin"],event_payload(title="Original meetup; special, event",venue="Hall A\nBEGIN:VALARM"));db.commit()
    text=events.event_ics(item)
    assert "\r\nBEGIN:VALARM" not in text
    assert "meetup\\; special\\, event" in text
    assert all(len(line.encode())<=75 for line in text.split("\r\n"))
    folded=events.fold_ics("SUMMARY:"+"\u00e9"*100)
    assert all(len(line.encode())<=75 for line in folded.split("\r\n"))
    assert text.endswith("END:VCALENDAR\r\n") and "Z\r\nDTEND:" in text
