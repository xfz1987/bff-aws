#!/bin/bash

# 部署 ECS/EC2/自己的服务器，AWS不需要使用
# 1. 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin master

# 2. 安装依赖
echo "📦 安装依赖..."
yarn install --production=false

# 3. 运行测试（可选）
# echo "✏️ 运行测试..."
# yarn test

# 4. 构建项目
echo "🔨 构建项目..."
yarn build

# 5. 零停机重载
echo "🔄 执行零停机重载..."
pm2 reload ecosystem.config.js --env production

# 6. 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

# 7. 检查状态
echo "✅ 检查应用状态..."
pm2 list

echo "🎉 部署完成！零停机重载成功！"

# 查看最近的日志
echo "📝 最近的日志："
pm2 logs xfz-bff --lines 20 --nostream