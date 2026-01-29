#!/bin/bash
# Clawdbot DingTalk Stream 通道插件安装脚本

set -e

echo "================================================"
echo "  Clawdbot DingTalk Stream 通道插件安装"
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

# 1. 检查 Clawdbot 是否已安装
echo -e "${YELLOW}[1/5] 检查 Clawdbot 安装...${NC}"
if ! command -v clawdbot &> /dev/null; then
    echo -e "${RED}错误: 未找到 clawdbot 命令，请先安装 Clawdbot${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Clawdbot 已安装${NC}"

# 2. 安装依赖
echo -e "${YELLOW}[2/5] 安装依赖...${NC}"
npm install
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 3. 构建项目
echo -e "${YELLOW}[3/5] 构建项目...${NC}"
npm run build
if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 构建失败，未生成 dist 目录${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 项目构建完成${NC}"

# 4. 复制文件到 Clawdbot 扩展目录
echo -e "${YELLOW}[4/5] 安装插件文件...${NC}"
mkdir -p "$INSTALL_DIR"

# 复制必要文件
cp -r dist "$INSTALL_DIR/"
cp -r node_modules "$INSTALL_DIR/"
cp -r src "$INSTALL_DIR/"
cp package.json "$INSTALL_DIR/"
cp index.ts "$INSTALL_DIR/"
cp clawdbot.plugin.json "$INSTALL_DIR/"

echo -e "${GREEN}✓ 插件文件已安装到 $INSTALL_DIR${NC}"

# 5. 重启 Clawdbot Gateway
echo -e "${YELLOW}[5/5] 重启 Clawdbot Gateway...${NC}"

# 检查是否存在 systemd 服务
if systemctl list-unit-files | grep -q "clawdbot-gateway.service"; then
    echo -e "${GREEN}✓ 检测到 systemd 服务${NC}"
    
    # 检查服务是否正在运行
    if systemctl is-active --quiet clawdbot-gateway.service; then
        echo "  重启服务..."
        systemctl restart clawdbot-gateway.service
        echo -e "${GREEN}✓ Clawdbot Gateway 服务已重启${NC}"
    else
        echo "  启动服务..."
        systemctl start clawdbot-gateway.service
        echo -e "${GREEN}✓ Clawdbot Gateway 服务已启动${NC}"
    fi
    
    # 显示服务状态
    sleep 1
    if systemctl is-active --quiet clawdbot-gateway.service; then
        echo -e "${GREEN}✓ 服务运行正常${NC}"
    else
        echo -e "${RED}✗ 服务启动失败，请检查日志${NC}"
        echo "  运行: journalctl -u clawdbot-gateway.service -n 50"
    fi
else
    echo -e "${YELLOW}! 未检测到 systemd 服务${NC}"
    echo "  请使用以下命令手动重启："
    echo "    clawdbot gateway restart"
    echo "  或者："
    echo "    pkill -f 'clawdbot gateway' && clawdbot gateway run &"
fi

# 完成
echo ""
echo "================================================"
echo -e "${GREEN}  ✅ 安装完成！${NC}"
echo "================================================"
echo ""
echo "下一步："
echo "  1. 编辑 ~/.clawdbot/clawdbot.json 添加钉钉通道配置"
echo "  2. 参考 clawdbot.json.example 配置示例"
echo ""
echo "查看日志："
if systemctl list-unit-files | grep -q "clawdbot-gateway.service"; then
    echo "  journalctl -u clawdbot-gateway.service -f | grep -i dingtalk"
else
    echo "  tail -f /tmp/clawdbot/clawdbot-*.log | grep -i dingtalk"
fi
echo ""
echo "测试插件："
echo "  在钉钉中给机器人发消息或 @机器人"
echo ""
echo "详细文档："
echo "  cat README.md"
echo "  cat QUICKSTART.md"
echo "  cat DEPLOY_STREAM.md"
echo ""
