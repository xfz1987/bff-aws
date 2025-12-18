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

# 设置 Lambda Layer
# echo "📦 Setting up Lambda layer..."
# cat > layer/nodejs/package.json << EOF
# {
#   "dependencies": {
#     "awilix": "^12.0.5",
#     "awilix-koa": "^11.1.0",
#     "co": "^4.6.0",
#     "koa": "^3.0.0",
#     "koa-router": "^13.0.1",
#     "koa-static": "^5.0.0",
#     "koa-swig": "^2.2.1",
#     "koa2-connect-history-api-fallback": "^0.1.3",
#     "lodash": "^4.17.21",
#     "module-alias": "^2.2.3",
#     "serverless-http": "^3.2.0"
#   }
# }
# EOF

# 在layer中安装依赖（--frozen-lockfile 锁版本）
cd layer/nodejs
echo "📦 Installing layer dependencies..."
yarn install --production --frozen-lockfile

# prisma generate
echo "📦 Generating prisma client into Layer..."
# 确保在当前目录执行，并告知编译器将输出定位到这里的 node_modules
# 我们直接使用本地 layer 目录下的 node_modules 作为目标
../../node_modules/.bin/prisma generate \
    --schema=../../prisma/schema.prisma \
    --generator=client

# 验证一下生成到了哪里
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Success: Prisma engines found in Layer."
else
    echo "❌ Error: Prisma engines still not in Layer! Checking root..."
    ls ../../node_modules/.prisma/client
    exit 1
fi

# 此时再执行清理
echo "🔍 Trimming Prisma engines in Layer..."
find node_modules/.prisma/client/ -name "query-engine-*" ! -name "*rhel-openssl-3.0.x*" -delete

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