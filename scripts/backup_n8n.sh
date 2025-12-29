
#!/bin/bash
# Backup n8n workflows to JSON

mkdir -p ./backups/n8n

# Export workflows using n8n CLI
# Requires n8n container to be running
docker compose exec -T n8n n8n export:workflow --all --output=/home/node/.n8n/workflows_backup.json

# Copy from container to host
docker compose cp n8n:/home/node/.n8n/workflows_backup.json ./backups/n8n/workflows_$(date +%Y%m%d_%H%M%S).json

echo "n8n Backup Completed."
