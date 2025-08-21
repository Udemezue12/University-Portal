# from logging.config import fileConfig
# from sqlalchemy import engine_from_config, pool
# from alembic import context
# import os
# import sys
# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# from database import Base
# from model import * # Import all models

# config = context.config
# fileConfig(config.config_file_name)

# # Connect to the database
# connectable = engine_from_config(
#     config.get_section(config.config_ini_section), prefix="sqlalchemy.", poolclass=pool.NullPool
# )

# with connectable.connect() as connection:
#     context.configure(
#         connection=connection,
#         target_metadata=Base.metadata
#     )

#     with context.begin_transaction():
#         context.run_migrations()

#
import os
import sys
from logging.config import fileConfig

from alembic import context

sys.path.insert(
    0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
)

from database import Base, SyncEngine

config = context.config
fileConfig(config.config_file_name)

config.set_main_option("sqlalchemy.url", "sqlite:///./crm.db")

target_metadata = Base.metadata


def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    connectable = SyncEngine
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


# Step 7: Decide offline vs online
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
