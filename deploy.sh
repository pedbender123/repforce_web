#!/bin/bash

# Define o IP da VPS
VPS_IP="31.97.166.12"
VPS_USER="root"
# ⚠️ IMPORTANTE: Ajuste este caminho para onde o projeto está na VPS
REMOTE_PATH="~/repforce_web" 

echo "🚀 [LOCAL] Iniciando Deploy para Desenvolvimento..."

# 1. Commit e Push Local (Garante que a VPS vai baixar a versão mais recente)
echo "📦 [LOCAL] Enviando alterações para o GitHub..."
git add .
git commit -m "WIP: Deploy automático via Antigravity" --allow-empty
git push origin main

# 2. Conexão SSH e Execução Remota
echo "🌐 [REMOTO] Conectando na VPS ($VPS_IP)..."

ssh -t $VPS_USER@$VPS_IP << EOF
    set -e # Para se der erro

    echo "📂 [VPS] Entrando na pasta do projeto..."
    cd $REMOTE_PATH

    echo "⬇️ [VPS] Atualizando código (hard reset)..."
    git fetch origin
    git reset --hard origin/main

    echo "🐳 [VPS] Reiniciando Docker..."
    cd repforce_web
    
    # Seus comandos exatos:
    docker compose down -v
    docker compose up --build -d
    
    echo "✅ [VPS] Containers subiram! Mostrando logs (Ctrl+C para sair)..."
    
    # O comando logs -f vai ficar rodando e mostrando a saída na sua tela
    docker compose logs -f
EOF