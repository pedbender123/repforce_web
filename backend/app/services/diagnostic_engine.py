import sys
import os
import glob
from sqlalchemy import text, inspect as sa_inspect
from app.shared.database import SessionSys
from app.db import models_system, models_tenant
# Import BaseCrm to check tenant models
from app.shared.database import BaseCrm

class DiagnosticEngine:
    def __init__(self, db_session=None):
        self.db = db_session or SessionSys()
        self.results = []

    def run_all(self, tenant_slug=None):
        """
        Orchestrates all checks.
        If tenant_slug is provided, it also checks that specific tenant's schema against models_tenant.
        """
        self.results = []
        try:
            self.check_system_environment()
            self.check_database_connectivity()
            
            # Check Public Schema (System)
            self.check_schema_consistency(models_system.Base.metadata, "public")
            
            # Check Tenant Schema (if requested)
            if tenant_slug:
                schema_name = f"tenant_{tenant_slug.replace('-', '_')}"
                self.check_schema_consistency(models_tenant.BaseCrm.metadata, schema_name)
                
            self.scan_codebase_health()
        except Exception as e:
            self._log("Global", "CRITICAL", "Diagnostic Engine Crashed", str(e))
        finally:
            self.db.close()
            
        return self.results

    def _log(self, category, status, message, details=""):
        self.results.append({
            "category": category,
            "status": status,
            "message": message,
            "details": details
        })

    def check_system_environment(self):
        # Python Version
        py_ver = sys.version.split()[0]
        self._log("Environment", "OK", f"Python Version: {py_ver}")

        # Env Vars
        critical_vars = ["DATABASE_URL", "SECRET_KEY"] 
        for var in critical_vars:
            val = os.getenv(var)
            if not val:
                 self._log("Environment", "WARN", f"Missing Env Var: {var}")
            else:
                 self._log("Environment", "OK", f"Env Var verified: {var}")

    def check_database_connectivity(self):
        try:
            self.db.execute(text("SELECT 1"))
            self._log("Database", "OK", "Connection Established")
        except Exception as e:
            self._log("Database", "CRITICAL", "Connection Failed", str(e))
            raise e # Stop further DB checks

    def check_schema_consistency(self, metadata, schema_name):
        inspector = sa_inspect(self.db.get_bind())
        
        try:
            db_tables = inspector.get_table_names(schema=schema_name)
        except Exception as e:
            self._log("Schema Integrity", "ERROR", f"Could not access schema '{schema_name}'", str(e))
            return

        for table_name, table_obj in metadata.tables.items():
            # Check Table Existence
            if table_obj.name not in db_tables:
                self._log("Schema Integrity", "ERROR", f"Table Missing: {table_obj.name}", f"Schema: {schema_name}")
                continue
            else:
                 self._log("Schema Integrity", "OK", f"Table verified: {table_obj.name}", f"Schema: {schema_name}")

            # Check Columns
            db_columns = inspector.get_columns(table_obj.name, schema=schema_name)
            db_col_names = {c['name'] for c in db_columns}
            
            for col in table_obj.columns:
                if col.name not in db_col_names:
                    self._log("Schema Integrity", "ERROR", f"Column Missing: {table_obj.name}.{col.name}", f"Schema: {schema_name}")

    def scan_codebase_health(self):
        # Scan backend/app for FIXME/TODO/print
        search_path = "/app/app/**/*.py"
        files = glob.glob(search_path, recursive=True)
        
        for file_path in files:
            # Skip self to avoid detecting the search patterns
            if "diagnostic_engine.py" in file_path:
                continue
                
            try:
                with open(file_path, "r") as f:
                    lines = f.readlines()
                    for i, line in enumerate(lines):
                        if "FIXME" in line:
                            self._log("Code Quality", "WARN", f"FIXME found in {os.path.basename(file_path)}", f"Line {i+1}: {line.strip()}")
                        if "pdb.set_trace" in line:
                            self._log("Code Quality", "WARN", f"Debugger found in {os.path.basename(file_path)}", f"Line {i+1}")
            except Exception:
                pass
