from datetime import timedelta
import pytest
from sqlalchemy import select,func
from sqlalchemy.exc import IntegrityError
from app.models import Resource,Bookmark,Rating,Fandom,FandomCategory,utcnow
from app.services import catalog,library
from app.schemas.requests import SearchQuery,PageQuery,ResourceInput
from app.common.errors import DomainError

def payload(**changes):
    return ResourceInput(**({"title":"A new story","summary":"A sufficiently descriptive summary.","category_id":"anime","status":"published"}|changes))

@pytest.mark.parametrize("state",["draft","archived","future"])
def test_nonpublic_content_hidden(db,people,content,state):
    if state=="future":content.published_at=utcnow()+timedelta(days=1)
    else:content.status=state
    db.commit()
    with pytest.raises(DomainError) as exc:catalog.get_public_resource(db,"r1")
    assert exc.value.status==404
    assert catalog.list_resources(db,SearchQuery())[1]["total"]==0

def test_public_filters_and_search_metacharacters(db,people,content):
    items,meta=catalog.list_resources(db,SearchQuery(category_id="anime",release_year=2026,q="original"))
    assert meta["total"]==1 and items[0]["id"]=="r1"
    assert catalog.list_resources(db,SearchQuery(q="%"))[1]["total"]==0
    assert catalog.list_resources(db,SearchQuery(q="' OR 1=1 --"))[1]["total"]==0
    assert catalog.list_resources(db,SearchQuery(category_id="gaming"))[1]["total"]==0

def test_pagination_stable_and_bounded(db,people):
    for i in range(5):catalog.create_resource(db,people["admin"],payload(title=f"Story {i}"))
    db.commit()
    a,meta=catalog.list_resources(db,SearchQuery(page_size=2,page=1,sort="az"))
    b,_=catalog.list_resources(db,SearchQuery(page_size=2,page=2,sort="az"))
    assert meta["total"]==5 and meta["total_pages"]==3
    assert not {x["id"] for x in a}&{x["id"] for x in b}

def test_admin_required_for_publication(db,people):
    with pytest.raises(DomainError) as e:catalog.create_resource(db,people["alice"],payload())
    assert e.value.status==403

def test_category_fandom_integrity(db,people):
    db.add(Fandom(id="f1",slug="original",name="Original"));db.flush()
    db.add(FandomCategory(fandom_id="f1",category_id="anime"));db.commit()
    with pytest.raises(DomainError):catalog.create_resource(db,people["admin"],payload(category_id="gaming",fandom_id="f1"))
    item=catalog.create_resource(db,people["admin"],payload(fandom_id="f1"));db.commit()
    assert item.fandom_id=="f1"

def test_optimistic_version_conflict(db,people,content):
    item=catalog.update_resource(db,people["admin"],"r1",payload(),1);db.commit()
    assert item.version==2
    with pytest.raises(DomainError) as e:catalog.update_resource(db,people["admin"],"r1",payload(),1)
    assert e.value.status==409

def test_resource_kind_cannot_change(db,people,content):
    with pytest.raises(DomainError):catalog.update_resource(db,people["admin"],"r1",payload(kind="character"),1)

def test_owner_scoped_bookmarks_and_idempotent_put(db,people,content):
    first=library.save_bookmark(db,people["alice"],"r1","private A")
    second=library.save_bookmark(db,people["alice"],"r1","updated A")
    library.save_bookmark(db,people["bob"],"r1","private B");db.commit()
    assert first["id"]==second["id"]
    items,meta=library.list_bookmarks(db,people["alice"],PageQuery())
    assert meta["total"]==1 and items[0]["note"]=="updated A"
    library.remove_bookmark(db,people["bob"],"r1");db.commit()
    assert library.list_bookmarks(db,people["alice"],PageQuery())[1]["total"]==1

def test_archived_bookmark_keeps_note_not_title(db,people,content):
    library.save_bookmark(db,people["alice"],"r1","my note");db.commit()
    catalog.archive_resource(db,people["admin"],"r1",1);db.commit()
    row=library.list_bookmarks(db,people["alice"],PageQuery())[0][0]
    assert row["title"]=="Unavailable item" and row["available"] is False and row["note"]=="my note"

def test_bookmark_foreign_key(db,people):
    db.add(Bookmark(user_id="alice",resource_id="missing",note=""))
    with pytest.raises(IntegrityError):db.flush()

def test_bookmark_unique_constraint(db,people,content):
    library.save_bookmark(db,people["alice"],"r1");db.flush()
    db.add(Bookmark(user_id="alice",resource_id="r1",note=""))
    with pytest.raises(IntegrityError):db.flush()

def test_rating_upsert_and_aggregate(db,people,content):
    library.rate_resource(db,people["alice"],"r1",3)
    library.rate_resource(db,people["alice"],"r1",5)
    library.rate_resource(db,people["bob"],"r1",3);db.commit()
    row=catalog.get_public_resource(db,"r1")
    assert row["rating_count"]==2 and row["rating_average"]==4

@pytest.mark.parametrize("value",[0,6])
def test_database_rating_check(db,people,content,value):
    db.add(Rating(user_id="alice",resource_id="r1",value=value))
    with pytest.raises(IntegrityError):db.flush()
