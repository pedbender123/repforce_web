from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import text
import logging
import os
from .core.middleware import TenantMiddleware
from .core.config import settings
from app.shared import database, security, schemas
from app.system import models as models_system

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- ENGINE ROUTERS (CRM Motor) ---
from app.engine.metadata import models as models_meta # REFAC: Metadata Engine Models

from app.engine.metadata import models as models_meta # REFAC: Metadata Engine Models
# Engine Models (Transient/Dynamic)
from app.engine.metadata import models as models_meta # REFAC: Metadata Engine Models
# Engine Models (Transient/Dynamic)
from app.engine import models_tenant 
from app.engine.services.seeder import seed_tenant_defaults 

# --- SYSTEM ROUTERS (OS Core) ---
from app.system.api import auth as v1_auth
from app.system.api.sysadmin import companies
from app.system.api import notifications # REFAC: Notifications API

# --- ENGINE ROUTERS (CRM Motor) ---
from app.engine.api import builder # REFAC: Builder API
from app.engine.api import metadata # REFAC: Engine Runtime API
from app.engine.api import data # REFAC: Universal Data API
from app.engine.api import actions # REFAC: Actions API (DEPRECATED - Use automation)
from app.engine.api import automation # NEW: Automation API
from app.engine.api import analytics # REFAC: Analytics API

# --- LEGACY / SHARED ROUTERS ---
# Reduced for Stability Protocol
from .api import admin, manager, diagnostics

app = FastAPI(title="Repforce API", version="0.4.0 (SaaS Lite)")

# Uploads Configuration
UPLOAD_ROOT = os.path.abspath("uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

@app.get("/uploads/{file_path:path}")
def serve_upload(file_path: str):
    full_path = os.path.join(UPLOAD_ROOT, file_path)
    if os.path.isfile(full_path):
        return FileResponse(full_path)
    return {"detail": "File not found"}, 404

@app.on_event("startup")
def startup_event():
    logger.info("Initializing Global Tables (Public Schema)...")
    try:
        models_system.Base.metadata.create_all(bind=database.engine)
        # Ensure Metadata models are also created (since they share Base but are in different file)
        # SQLAlchemy creates all tables for Base subclass imported.
    except Exception as e:
        logger.error(f"Schema Init Error (Ensure Postgres is up): {e}")
    
    # 2. Seed SysAdmin (Global)
    db = database.SessionSys()
    try:
        # Check if user exists
        # Note: SessionSys is bound to engine, default search_path=public usually
        sysadmin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == "pbrandon").first()
        if not sysadmin_user:
            logger.info("Seeding SysAdmin...")
            hashed_pw = security.get_password_hash(settings.SYSADMIN_DEFAULT_PASSWORD)
            sysadmin_user = models_system.GlobalUser(
                username="pbrandon",
                recovery_email="pedro.p.bender.randon@gmail.com", 
                password_hash=hashed_pw,
                full_name="Pedro Bender",
                is_superuser=True,
                is_active=True
            )
            db.add(sysadmin_user)
            db.commit()
            logger.info("SysAdmin created: pbrandon")

        # Check for 'admin' user
        admin_user = db.query(models_system.GlobalUser).filter(models_system.GlobalUser.username == "admin").first()
        if not admin_user:
            logger.info("Seeding Admin...")
            hashed_pw = security.get_password_hash(settings.ADMIN_DEFAULT_PASSWORD)
            admin_user = models_system.GlobalUser(
                username="admin",
                recovery_email="admin@repforce.com", 
                password_hash=hashed_pw,
                full_name="Administrator",
                is_superuser=True,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Admin created: admin")
        
        # 3. Seed "Rotas" Entity (Default for first tenant)
        # Assuming the first tenant is the default one created by system or manual request
        first_tenant = db.query(models_system.Tenant).first()
        if first_tenant:
             seed_tenant_defaults(db, first_tenant.id)
    except Exception as e:
        logger.error(f"Startup Seeding Error: {e}")
    finally:
        db.close()

app.add_middleware(TenantMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Repforce API Online (SaaS Lite)"}

# Definição das Rotas
# Definição das Rotas - ADM CORE ONLY
# app.include_router(auth.router, prefix="/auth", tags=["Autenticação"]) # DEPRECATED
app.include_router(manager.router, prefix="/manager", tags=["Manager (Provisioning)"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Tenant"])
app.include_router(v1_auth.router, prefix="/v1", tags=["V1 Auth"])
# User Notifications System
app.include_router(notifications.router, prefix="/v1/notifications", tags=["System Notifications"])
# Builder API (No-Code Engine)
app.include_router(builder.router, prefix="/api/builder", tags=["Builder"])
app.include_router(metadata.router, prefix="/api/engine", tags=["Engine Runtime"])
app.include_router(data.router, prefix="/api/engine", tags=["Universal Data"])
# app.include_router(actions.router, prefix="/api/engine", tags=["Engine Actions"]) # DEPRECATED
app.include_router(automation.router, prefix="/api/engine/automation", tags=["Engine Automation"])
app.include_router(analytics.router, prefix="/api/engine/analytics", tags=["Engine Analytics"])
app.include_router(companies.router, prefix="/v1/sysadmin/companies", tags=["SysAdmin Companies"])
app.include_router(diagnostics.router, prefix="/v1/sysadmin/diagnostics", tags=["SysAdmin Diagnostics"])

# Templates API
from app.system.api.sysadmin import templates
app.include_router(templates.router, prefix="/v1/sysadmin/templates", tags=["SysAdmin Templates"])

# --- SCHEDULER (V1.0 MVP) ---
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import asyncio

scheduler = BackgroundScheduler()

def check_scheduled_trails():
    """
    Heartbeat job to check for scheduled trails (Timer/Cron).
    Runs every 60 seconds.
    """
    logger.info("Scheduler Heartbeat...")
    db = database.SessionSys()
    try:
        # Find active Scheduler trails
        # Note: We need to check all tenants.
        # Ideally, we iterate tenants, but for now we query all MetaTrails globally if possible?
        # MetaTrail is in 'public' schema but usually filtered by tenant_id.
        # Since we are in sys context, we can query all.
        
        trails = db.query(models_meta.MetaTrail).filter(
            models_meta.MetaTrail.trigger_type == 'SCHEDULER',
            models_meta.MetaTrail.is_active == True
        ).all()
        
        for trail in trails:
            config = trail.trigger_config or {}
            interval_mins = int(config.get('interval', 0))
            if interval_mins <= 0: continue
            
            last_run_str = config.get('last_run')
            should_run = False
            now = datetime.utcnow()
            
            if not last_run_str:
                should_run = True
            else:
                last_run = datetime.fromisoformat(last_run_str)
                if (now - last_run) > timedelta(minutes=interval_mins):
                    should_run = True
            
            if should_run:
                logger.info(f"Executing Scheduled Trail: {trail.name}")
                
                # 3. Contextualize Tenant Schema
                # We need to set the search_path so that the TrailExecutor can find the dynamic tables
                # stored in the tenant's schema.
                if trail.tenant and trail.tenant.slug:
                    schema_name = f"tenant_{trail.tenant.slug.replace('-', '_')}"
                    db.execute(text(f"SET search_path TO {schema_name}, public"))
                
                # Execute Trail
                # We need to use TrailExecutor. But it requires a tenant-scoped session usually?
                # TrailExecutor takes (db, tenant_id).
                
                # Execute Trail (New Architecture)
                from app.engine.automation.service import AutomationService
                service = AutomationService(db)
                
                payload = {
                    "trigger": "scheduler",
                    "timestamp": now.isoformat()
                }
                
                service.run_trail(str(trail.id), payload)
                
                # Update Last Run
                config['last_run'] = now.isoformat()
                # Flag modified for SQLAlchemy (JSON mutation detection is tricky)
                trail.trigger_config = config 
                # Re-assigning dict usually triggers update in standard ORM usage if specific type used, 
                # but explicit reassignment is safer.
                
                # Note: This commits the transaction for each trail run to save state.
                db.commit()

    except Exception as e:
        logger.error(f"Scheduler Error: {e}")
        db.rollback()
    finally:
        db.close()

@app.on_event("startup")
def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_scheduled_trails, 'interval', seconds=60)
        scheduler.start()
        logger.info("Task Scheduler Started (60s interval)")

@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()