import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# On Render the persistent disk is mounted at /data; fall back to local file in dev
_db_path = "/data/expenses.db" if os.path.isdir("/data") else "./expenses.db"
DATABASE_URL = f"sqlite:///{_db_path}"

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()