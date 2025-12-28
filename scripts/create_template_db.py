import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "backend/app/data")
TEMPLATE_DB_PATH = os.path.join(DATA_DIR, "template.db")

# Add backend to path for imports
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.db import models_crm

def create_template():
    print(f"Creating template DB at {TEMPLATE_DB_PATH}...")
    os.makedirs(DATA_DIR, exist_ok=True)
    
    # Connect
    url = f"sqlite:///{TEMPLATE_DB_PATH}"
    engine = create_engine(url)
    
    # Create Tables
    models_crm.BaseCrm.metadata.create_all(bind=engine)
    print("Template DB initialized with CRM schema.")

if __name__ == "__main__":
    try:
        create_template()
    except Exception as e:
        print(f"Error: {e}")
