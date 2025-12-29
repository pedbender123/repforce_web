
import ipaddress
from fastapi import Request, HTTPException, status

# Docker Internal Subnets usually 172.16.0.0/12 or 192.168...
# We allow private networks.
ALLOWED_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
]

# Allow generic whitelist via ENV (for VPS public IP loopback)
import os
EXTRA_IPS = os.getenv("N8N_WHITELIST_IPS", "").split(",")
for ip_str in EXTRA_IPS:
    if ip_str.strip():
        try:
             # Assume single IPs usually, can extend to networks if needed
             ALLOWED_NETWORKS.append(ipaddress.ip_network(ip_str.strip() + "/32"))
        except:
             pass

def validate_n8n_request(request: Request):
    """
    Dependency to validate if the request comes from a trusted internal IP (n8n container).
    """
    client_host = request.client.host
    if not client_host:
        raise HTTPException(status_code=403, detail="Unknown Client IP")
        
    try:
        ip = ipaddress.ip_address(client_host)
        is_allowed = any(ip in net for net in ALLOWED_NETWORKS)
        
        if not is_allowed:
            print(f"Blocked External API Access attempt from: {client_host}")
            raise HTTPException(status_code=403, detail="Access Restricted to Internal Service Network")
            
        # Optional: Check a simple shared secret content-type or header if paranoid
        return True
        
    except ValueError:
        raise HTTPException(status_code=403, detail="Invalid IP Format")
