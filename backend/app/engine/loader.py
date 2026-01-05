import importlib.util
import os
import sys
from pathlib import Path
from typing import Any, Optional

# The base directory where tenant-specific code resides
# In Docker, this should be a mounted volume
TENANTS_BASE_DIR = Path(__file__).parent.parent.parent.parent / "tenants"

class TenantLoader:
    _cache = {}

    @classmethod
    def get_module(cls, tenant_slug: str, module_name: str) -> Optional[Any]:
        """
        Dynamically loads a module from the tenant's directory.
        Path: tenants/<tenant_slug>/<module_name>.py
        """
        if not tenant_slug:
            return None

        cache_key = f"{tenant_slug}.{module_name}"
        if cache_key in cls._cache:
            return cls._cache[cache_key]

        # Sanitize slug
        safe_slug = tenant_slug.replace("-", "_")
        module_path = TENANTS_BASE_DIR / safe_slug / f"{module_name}.py"

        if not module_path.exists():
            # If tenant specific module doesn't exist, we don't cache 'None' 
            # so it can be added later without restart (maybe?)
            return None

        try:
            spec = importlib.util.spec_from_file_location(
                f"tenants.{safe_slug}.{module_name}", 
                str(module_path)
            )
            module = importlib.util.module_from_spec(spec)
            # Add to sys.modules to allow relative imports within the plugin if needed
            sys.modules[f"tenants.{safe_slug}.{module_name}"] = module
            spec.loader.exec_module(module)
            
            cls._cache[cache_key] = module
            return module
        except Exception as e:
            print(f"Error loading plugin for {tenant_slug}/{module_name}: {e}")
            return None

    @classmethod
    def clear_cache(cls):
        cls._cache = {}
