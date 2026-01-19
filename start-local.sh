#!/bin/bash

# Docker不要の直接起動スクリプト

echo "📦 依存関係をインストール中..."
npm install

echo "🔨 TypeScriptをビルド中..."
npm run build

echo "🚀 Botを起動します..."
npm start
