#!/bin/bash

# 先授权 chmod +x build.sh

# 构建脚本 - 编译TypeScript并复制静态资源
set -e # 遇到错误立即退出

echo "🔨 开始构建..."

# 1. 编译 TypeScript
echo "📦 编译 TypeScript..."
tsc

# 2. 复制 views 目录
echo "📂 复制 views 目录到 dist..."
cp -r views dist/views

# 3. 复制 assets 目录
echo "📂 复制 assets 目录到 dist..."
cp -r assets dist/assets

echo "✅ 构建完成！"