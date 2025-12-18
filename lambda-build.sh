#!/bin/bash

if [ -z "$1" ]; then
    echo "❌ Environment parameter is required! Please use: ./build.sh [development|production|test]"
    exit 1
fi

ENV=$1
ENV_FILE=".env.$ENV"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE does not exist!"
    exit 1
fi

# 清理旧的构建文件
echo "🧹 Cleaning up old build files..."

rm -rf dist/
# sam build -> 本地 docker 模拟线上环境 -> 本地生成 .aws-sam 目录
rm -rf .aws-sam/
rm -rf layer/

# 创建必要的目录
mkdir -p dist/
mkdir -p layer/nodejs

# 使用webpack构建应用
echo "🏗️ Building application with webpack..."
yarn run build

# 设置 Lambda Layer - 复制 package.json 并只保留 dependencies
echo "📦 Setting up Lambda layer..."

# 复制 package.json 到 layer/nodejs 目录
echo "📂 复制 package.json 到 layer/nodejs..."
cp -r package.json layer/nodejs
cp -r yarn.lock layer/nodejs

cd layer/nodejs

# 使用 node 删除 devDependencies，减小安装体积
node -e "const pkg = require('./package.json'); delete pkg.devDependencies; delete pkg.scripts; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# 在layer中安装依赖（--production 只安装 dependencies）
echo "📦 Installing layer dependencies..."
yarn install --production --frozen-lockfile

# 复制 prisma schema 到当前目录
echo "📦 Copying Prisma schema..."
mkdir -p prisma
cp ../../prisma/schema.prisma prisma/

# 临时安装 prisma CLI（用于 generate）
echo "📦 Temporarily installing Prisma CLI..."
yarn add prisma@6.19.1 --dev --ignore-workspace-root-check

# 在当前目录执行 prisma generate（会生成到当前目录的 node_modules）
echo "📦 Generating Prisma client into Layer..."
npx prisma generate

# 验证一下生成到了哪里
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Success: Prisma engines found in Layer."
else
    echo "❌ Error: Prisma engines still not in Layer! Checking root..."
    ls ../../node_modules/.prisma/client
    exit 1
fi

# 🔍 清理不需要的 Prisma engines 和文件：同时保留 RHEL(x86) 和 ARM64 的引擎，防止误删
echo "🔍 Trimming Prisma engines in Layer (Keeping ARM64 and RHEL)..."
find node_modules/.prisma/client/ -name "query-engine-*" ! -name "*rhel-openssl-3.0.x*" ! -name "*linux-arm64-openssl-3.0.x*" -delete
find node_modules/.prisma/client/ -name "libquery_engine-*" ! -name "*rhel-openssl-3.0.x*" ! -name "*linux-arm64-openssl-3.0.x*" -delete

# 删除 Lambda 不需要的 Prisma 文件（Edge/Browser/WASM）
echo "🗑️ Removing unnecessary Prisma files..."
rm -f node_modules/.prisma/client/edge.js
rm -f node_modules/.prisma/client/index-browser.js
rm -f node_modules/.prisma/client/query_engine_bg.js
rm -f node_modules/.prisma/client/query_engine_bg.wasm
rm -f node_modules/.prisma/client/wasm*.js
rm -f node_modules/.prisma/client/wasm*.mjs

# 删除临时文件（prisma CLI 和 schema 目录）
echo "🗑️ Removing temporary Prisma files..."
rm -rf prisma
rm -rf node_modules/prisma
rm -rf node_modules/.bin/prisma

# 进一步清理 node_modules，删除不必要的文件以减小体积
echo "🧹 Cleaning unnecessary files from node_modules..."
find node_modules -name "*.md" -type f -delete
find node_modules -name "*.ts" -type f ! -path "*/node_modules/.prisma/*" -delete
find node_modules -name "*.map" -type f -delete
find node_modules -name "LICENSE*" -type f -delete
find node_modules -name "CHANGELOG*" -type f -delete
find node_modules -type d -name "test" -o -name "tests" -o -name "__tests__" -o -name "coverage" -o -name ".github" | xargs rm -rf
find node_modules -type d -name "docs" -o -name "examples" -o -name "example" | xargs rm -rf

echo "🧹 清理 Layer 中可能导致上传失败的损坏软链接..."
# 1. 强制删除所有 node_modules 下的 .bin 目录
# 这些目录里全是软链接，且 Lambda 运行时完全不需要它们
find node_modules -name ".bin" -type d -exec rm -rf {} +

# 2. 额外保险：删除 @prisma/client 内部嵌套的 node_modules（如果有）
# 因为我们已经在 Layer 根部安装了所有依赖，嵌套的通常是冗余且带软链接的
rm -rf node_modules/@prisma/client/node_modules

echo "✅ 软链接清理完成。"

echo "📊 Final layer size (including Prisma)::"
du -sh node_modules/
cd ../../

# 准备函数部署包（不安全）
# echo "📦 Preparing function package..."
# cp "$ENV_FILE" "dist/env"

# 执行 sam build 和部署
echo "🚀 Running sam build..."
sam build --skip-pull-image

if [ $? -eq 0 ]; then
    if [ "$ENV" = "production" ] || [ "$ENV" = "test" ]; then
        echo "🚀 Deploying to production..."
        sam deploy -g
    else
        echo "🌍 Starting local API..."
        sam local start-api --warm-containers EAGER
    fi
else
    echo "❌ Sam build failed!"
    exit 1
fi