#!/bin/bash
echo "Verificando tabelas no container repforce_db..."
docker exec repforce_db psql -U repforce_user -d repforce_db -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'tenant_1';"
