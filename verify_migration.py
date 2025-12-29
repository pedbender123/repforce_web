
import os
import sys
import re

def check_file(path, should_exist=True):
    exists = os.path.exists(path)
    if should_exist and not exists:
        print(f"[FAIL] Missing: {path}")
        return False
    elif not should_exist and exists:
        print(f"[FAIL] Should NOT exist: {path}")
        return False
    print(f"[OK] {path} {'exists' if exists else 'is gone'}")
    return True

def check_content(path, pattern, should_contain=True):
    if not os.path.exists(path):
        print(f"[FAIL] File not found for content check: {path}")
        return False
    
    with open(path, 'r') as f:
        content = f.read()
        
    found = bool(re.search(pattern, content))
    if should_contain and not found:
        print(f"[FAIL] {path} missing pattern: {pattern}")
        return False
    elif not should_contain and found:
        print(f"[FAIL] {path} contains forbidden pattern: {pattern}")
        return False
    print(f"[OK] {path} content check passed ('{pattern}')")
    return True

def main():
    base = "."
    backend = os.path.join(base, "backend")
    
    print("--- 1. File Structure Checks ---")
    valid = True
    valid &= check_file(os.path.join(backend, "app/db/session.py"), True)
    valid &= check_file(os.path.join(backend, "app/db/database.py"), False)
    valid &= check_file(os.path.join(backend, "app/db/models_system.py"), True)
    valid &= check_file(os.path.join(backend, "app/db/models_global.py"), False)
    valid &= check_file(os.path.join(backend, "app/db/models_tenant.py"), True)
    valid &= check_file(os.path.join(backend, "app/core/security_n8n.py"), True)
    valid &= check_file(os.path.join(backend, "app/services/event_bus.py"), True)
    valid &= check_file(os.path.join(backend, "app/api/v1/automation.py"), True)
    
    print("\n--- 2. Import & Content Checks ---")
    # Check if we successfully purged 'app.db.database' refs
    valid &= check_content(os.path.join(backend, "app/main.py"), "app.db.database", False)
    valid &= check_content(os.path.join(backend, "app/api/manager.py"), "app.db.database", False)
    valid &= check_content(os.path.join(backend, "app/middleware.py"), "models_global", False)
    valid &= check_content(os.path.join(backend, "app/db/session.py"), "tenant_slug", True)
    
    print("\n--- 3. Config Checks ---")
    valid &= check_content(os.path.join(base, "docker-compose.yml"), "n8n", True)
    
    if not valid:
        print("\n[FAILED] Verification found issues.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] Resilient SaaS Architecture Verification Passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
