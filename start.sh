#!/bin/bash

# Docker起動確認スクリプト

echo "🔍 Dockerの状態を確認中..."

if ! docker info > /dev/null 2>&1; then
    echo "❌ Dockerが起動していません"
    echo "📱 Docker Desktopを起動中..."
    open -a Docker
    
    echo "⏳ Dockerの起動を待機中..."
    while ! docker info > /dev/null 2>&1; do
        sleep 2
        echo "   待機中..."
    done
    echo "✅ Docker起動完了！"
else
    echo "✅ Docker起動済み"
fi

echo ""
echo "🚀 Botを起動します..."
docker-compose up -d

echo ""
echo "📋 ログを表示するには:"
echo "   docker-compose logs -f"
