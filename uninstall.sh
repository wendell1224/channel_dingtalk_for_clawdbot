#!/bin/bash
# Clawdbot DingTalk Stream 通道插件卸载脚本

set -e

echo "================================================"
echo "  Clawdbot DingTalk Stream 通道插件卸载"
echo "================================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}错误: 请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 安装目录
INSTALL_DIR="/usr/lib/node_modules/clawdbot/extensions/dingtalk-stream"

# 1. 确认卸载
echo -e "${YELLOW}即将卸载 DingTalk Stream 插件${NC}"
echo -e "插件目录: ${INSTALL_DIR}"
echo ""
read -p "确认卸载? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}已取消卸载${NC}"
    exit 0
fi

# 2. 删除插件文件
echo -e "${YELLOW}[1/3] 删除插件文件...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo -e "${GREEN}✓ 插件文件已删除${NC}"
else
    echo -e "${YELLOW}! 插件目录不存在，可能已被删除${NC}"
fi

# 3. 提示修改配置文件
echo -e "${YELLOW}[2/3] 配置清理提示...${NC}"
echo -e "${YELLOW}请手动从以下配置文件中删除 DingTalk 相关配置:${NC}"
echo "  - ~/.clawdbot/clawdbot.json"
echo "    删除 channels.dingtalk 部分"
echo ""

# 4. 重启 Clawdbot Gateway
echo -e "${YELLOW}[3/3] 重启 Clawdbot Gateway...${NC}"

SYSTEMCTL_SERVICE="clawdbot-gateway.service"

if systemctl list-unit-files | grep -q "$SYSTEMCTL_SERVICE"; then
    echo -e "${GREEN}✓ 检测到 systemd 服务${NC}"
    echo -e "${YELLOW}  重启服务...${NC}"
    systemctl restart "$SYSTEMCTL_SERVICE"
    sleep 2 # 等待服务启动
    if systemctl is-active --quiet "$SYSTEMCTL_SERVICE"; then
        echo -e "${GREEN}✓ Clawdbot Gateway 服务已重启并运行正常${NC}"
    else
        echo -e "${RED}错误: Clawdbot Gateway 服务启动失败，请检查日志${NC}"
        echo -e "${YELLOW}  运行 'journalctl -u $SYSTEMCTL_SERVICE -n 100 --no-pager' 查看详情${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}! 未检测到 systemd 服务${NC}"
    echo -e "${YELLOW}  请使用以下命令手动重启：${NC}"
    echo -e "${YELLOW}    clawdbot gateway restart${NC}"
    echo -e "${YELLOW}  或者：${NC}"
    echo -e "${YELLOW}    pkill -f 'clawdbot gateway' && clawdbot gateway run &${NC}"
fi

# 完成
echo ""
echo "================================================"
echo -e "${GREEN}  ✅ 卸载完成！${NC}"
echo "================================================"
echo ""
echo "后续步骤："
echo "  1. 编辑 ~/.clawdbot/clawdbot.json"
echo "  2. 删除 channels.dingtalk 配置节"
echo "  3. 运行 'clawdbot gateway restart' 使配置生效"
echo ""
echo "查看日志："
echo "  journalctl -u clawdbot-gateway.service -f"
echo ""
