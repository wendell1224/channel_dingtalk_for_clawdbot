#!/bin/bash
# DingTalk Stream 插件快速更新脚本
# 在服务器上运行此脚本以更新到最新版本

set -e

echo "🚀 DingTalk Stream Plugin - Quick Update Script"
echo "================================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否为 root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ 请使用 root 权限运行此脚本${NC}"
  echo "   sudo bash deploy-update.sh"
  exit 1
fi

WORK_DIR="/tmp/channel_dingtalk_for_clawdbot"
INSTALL_DIR="/usr/lib/node_modules/clawdbot/extensions/dingtalk"

echo ""
echo -e "${YELLOW}📥 步骤 1/6: 拉取最新代码${NC}"
cd "$WORK_DIR"
git pull origin main
echo -e "${GREEN}✅ 代码更新完成${NC}"

echo ""
echo -e "${YELLOW}📦 步骤 2/6: 安装依赖${NC}"
npm install
echo -e "${GREEN}✅ 依赖安装完成${NC}"

echo ""
echo -e "${YELLOW}🔨 步骤 3/6: 编译 TypeScript${NC}"
npm run build
echo -e "${GREEN}✅ 编译完成${NC}"

echo ""
echo -e "${YELLOW}📋 步骤 4/6: 备份旧版本${NC}"
if [ -d "$INSTALL_DIR" ]; then
  BACKUP_DIR="${INSTALL_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
  mv "$INSTALL_DIR" "$BACKUP_DIR"
  echo -e "${GREEN}✅ 旧版本已备份到: $BACKUP_DIR${NC}"
else
  echo -e "${YELLOW}⚠️  未找到旧版本（首次安装）${NC}"
fi

echo ""
echo -e "${YELLOW}📂 步骤 5/6: 安装新版本${NC}"
mkdir -p "$INSTALL_DIR"
cp -r dist/* "$INSTALL_DIR/"
cp package.json "$INSTALL_DIR/"
cp clawdbot.plugin.json "$INSTALL_DIR/"

# 安装生产依赖
cd "$INSTALL_DIR"
npm install --production
echo -e "${GREEN}✅ 新版本安装完成${NC}"

echo ""
echo -e "${YELLOW}🔄 步骤 6/6: 重启 Clawdbot Gateway${NC}"
systemctl restart clawdbot-gateway
sleep 2
echo -e "${GREEN}✅ 服务已重启${NC}"

echo ""
echo "================================================"
echo -e "${GREEN}🎉 更新完成！${NC}"
echo ""
echo "📊 查看日志："
echo "   journalctl -u clawdbot-gateway.service -f | grep -i dingtalk"
echo ""
echo "📝 预期日志："
echo "   [dingtalk] initializing Stream client with appKey: ..."
echo "   [dingtalk] connecting to Stream server..."
echo "   [dingtalk] ✅ Stream connection established successfully!"
echo "   [dingtalk] waiting for messages..."
echo ""
echo "🧪 测试方法："
echo "   1. 在钉钉中私聊机器人发送消息"
echo "   2. 在群聊中 @机器人发送消息"
echo ""
echo -e "${YELLOW}正在显示最新日志（Ctrl+C 退出）...${NC}"
echo ""

sleep 2
journalctl -u clawdbot-gateway.service -f | grep -i dingtalk
