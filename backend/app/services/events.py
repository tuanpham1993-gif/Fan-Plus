from math import radians, sin, cos, atan2, sqrt, ceil, degrees
from sqlalchemy import select, or_
from app.models import Resource, EventDetail, AuditLog, utcnow, iso
from app.common.errors import DomainError
from .catalog import public_filter, validate_references, slugify
from .policy import require_admin

def haversine(lat1,lon1,lat2,lon2):
    delta_lat,delta_lon=radians(lat2-lat1),radians(lon2-lon1)
    a=sin(delta_lat/2)**2+cos(radians(lat1))*cos(radians(lat2))*sin(delta_lon/2)**2
    a=max(0.0,min(1.0,a))
    return 6371.0088*2*atan2(sqrt(a),sqrt(1-a))

def event_dto(resource,event,distance=None):
    return {"id":resource.id,"title":resource.title,"summary":resource.summary,"category_id":resource.category_id,"city":event.city,"venue":event.venue,"latitude":float(event.latitude),"longitude":float(event.longitude),"starts_at":iso(event.starts_at),"ends_at":iso(event.ends_at),"timezone_name":event.timezone_name,"ticket_url":event.ticket_url,"cancelled":event.cancelled,"distance_km":round(distance,2) if distance is not None else None,"version":resource.version}

def nearby_events(db,query):
    statement=select(Resource,EventDetail).join(EventDetail,EventDetail.resource_id==Resource.id).where(*public_filter(),EventDetail.ends_at>=utcnow(),EventDetail.cancelled.is_(False))
    if query.city:statement=statement.where(EventDetail.city==query.city)
    if query.latitude is not None:
        lat_delta=degrees(query.radius_km/6371.0088)
        low,high=max(-90,query.latitude-lat_delta),min(90,query.latitude+lat_delta)
        statement=statement.where(EventDetail.latitude.between(low,high))
        # A conservative box handles date-line crossing and skips longitude near poles.
        if low>-90 and high<90:
            max_lat=max(abs(low),abs(high))
            lon_delta=min(180,lat_delta/max(cos(radians(max_lat)),0.001))
            if lon_delta<180:
                lo,hi=query.longitude-lon_delta,query.longitude+lon_delta
                if lo < -180: statement=statement.where(or_(EventDetail.longitude>=lo+360,EventDetail.longitude<=hi))
                elif hi > 180: statement=statement.where(or_(EventDetail.longitude>=lo,EventDetail.longitude<=hi-360))
                else: statement=statement.where(EventDetail.longitude.between(lo,hi))
    candidates=db.execute(statement.order_by(EventDetail.starts_at,Resource.id).limit(2001)).all()
    if len(candidates)>2000:raise DomainError("QUERY_TOO_BROAD","Narrow the event city or radius.",422)
    items=[]
    for resource,event in candidates:
        distance=haversine(query.latitude,query.longitude,float(event.latitude),float(event.longitude)) if query.latitude is not None else None
        if distance is None or distance<=query.radius_km:items.append(event_dto(resource,event,distance))
    # Exact distance filtering precedes pagination. No GPS coordinate is persisted.
    if query.latitude is not None:items.sort(key=lambda x:(x["distance_km"],x["starts_at"],x["id"]))
    total=len(items);start=(query.page-1)*query.page_size
    return items[start:start+query.page_size],{"page":query.page,"page_size":query.page_size,"total":total,"total_pages":ceil(total/query.page_size)}

def get_event(db,event_id):
    row=db.execute(select(Resource,EventDetail).join(EventDetail,EventDetail.resource_id==Resource.id).where(Resource.id==event_id,*public_filter())).first()
    if not row:raise DomainError("NOT_FOUND","Event was not found.",404)
    return event_dto(*row)

def create_event(db,actor,payload,request_id=None):
    require_admin(actor);validate_references(db,payload.category_id)
    resource=Resource(title=payload.title,summary=payload.summary,slug=slugify(payload.title),kind="event",category_id=payload.category_id,author_id=actor.id,status="published",published_at=utcnow())
    db.add(resource);db.flush()
    event=EventDetail(resource_id=resource.id,**payload.model_dump(exclude={"title","summary","category_id"}))
    db.add(event);db.flush()
    db.add(AuditLog(actor_id=actor.id,action="event.create",target_type="resource",target_id=resource.id,request_id=request_id,details={}))
    return event_dto(resource,event)

def ics_escape(value):
    return str(value).replace("\\","\\\\").replace("\r\n","\n").replace("\r","\n").replace("\n","\\n").replace(",","\\,").replace(";","\\;")

def fold_ics(line):
    result=[];current="";size=0
    for char in line:
        width=len(char.encode("utf-8"))
        if size+width>75:
            result.append(current);current=" ";size=1
        current+=char;size+=width
    result.append(current)
    return "\r\n".join(result)

def event_ics(event):
    from datetime import datetime
    stamp=lambda value:datetime.fromisoformat(value.replace("Z","+00:00")).strftime("%Y%m%dT%H%M%SZ")
    lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Fan Hub Plus//Event calendar//EN","CALSCALE:GREGORIAN","BEGIN:VEVENT","UID:"+event["id"]+"@fanhub.local","DTSTAMP:"+utcnow().strftime("%Y%m%dT%H%M%SZ"),"DTSTART:"+stamp(event["starts_at"]),"DTEND:"+stamp(event["ends_at"]),"SUMMARY:"+ics_escape(event["title"]),"LOCATION:"+ics_escape(event["venue"]+", "+event["city"]),"DESCRIPTION:"+ics_escape(event["summary"])]
    if event["cancelled"]:lines.append("STATUS:CANCELLED")
    lines += ["END:VEVENT","END:VCALENDAR"]
    return "\r\n".join(fold_ics(line) for line in lines)+"\r\n"
