from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

def make_engine(url):
    options={"pool_pre_ping":True}
    if url.startswith("sqlite"):
        options["connect_args"]={"check_same_thread":False}
        if url in ("sqlite://","sqlite:///:memory:"):options["poolclass"]=StaticPool
    else:
        options.update(pool_recycle=1800,pool_size=5,max_overflow=5)
    engine=create_engine(url,**options)
    if engine.dialect.name=="sqlite":
        @event.listens_for(engine,"connect")
        def sqlite_foreign_keys(connection,record):
            cursor=connection.cursor();cursor.execute("PRAGMA foreign_keys=ON");cursor.close()
    return engine

def init_db(app):
    Path(app.instance_path).mkdir(parents=True,exist_ok=True)
    engine=make_engine(app.config["DATABASE_URL"])
    app.extensions["db_engine"]=engine
    app.extensions["db_sessions"]=sessionmaker(bind=engine,expire_on_commit=False)
