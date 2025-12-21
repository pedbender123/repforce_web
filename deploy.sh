#!/bin/bash
echo "🚀 [LOCAL] Iniciando Deploy para Desenvolvimento..."
echo "📦 [LOCAL] Enviando alterações para o GitHub..."
git add .
git commit -m "WIP: Deploy automático via Antigravity"
git push origin main
echo "🌐 [REMOTO] Conectando na VPS (31.97.166.12)..."
ssh root@31.97.166.12 << 'EOF'
cd /root/repforce_web
git fetch origin
git reset --hard origin/main
docker compose down
docker compose up -d --build
EOF
