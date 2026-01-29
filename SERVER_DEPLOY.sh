#!/bin/bash
# 在服务器上复制并运行此命令即可完成部署

echo "================================================"
echo "  🚀 DingTalk Stream Plugin - 一键部署"
echo "================================================"
echo ""
echo "📥 正在拉取最新代码..."
cd /tmp/channel_dingtalk_for_clawdbot
git pull origin main

echo ""
echo "🚀 开始部署..."
sudo bash deploy-update.sh
