import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass # Runtime requirements include dotenv; isolated schema tests need not.
from alembic import context
from sqlalchemy import engine_from_config, pool
from app.models import Base
config=context.config
url=os.getenv("DATABASE_URL")
if url:config.set_main_option("sqlalchemy.url",url.replace("%","%%"))
target_metadata=Base.metadata

def run_migrations_offline():
    context.configure(url=config.get_main_option("sqlalchemy.url"),target_metadata=target_metadata,literal_binds=True,dialect_opts={"paramstyle":"named"},compare_type=True)
    with context.begin_transaction():context.run_migrations()

def run_migrations_online():
    engine=engine_from_config(config.get_section(config.config_ini_section),prefix="sqlalchemy.",poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection,target_metadata=target_metadata,compare_type=True,render_as_batch=connection.dialect.name=="sqlite")
        with context.begin_transaction():context.run_migrations()
    engine.dispose()

if context.is_offline_mode():run_migrations_offline()
else:run_migrations_online()
