#!/bin/bash
# Clawdbot DingTalk 通道插件安装脚本（轻量版）

set -e

echo "================================================"
echo "  Clawdbot DingTalk 通道插件安装（轻量版）"
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
INSTALL_DIR="/usr/lib/node_modules/clawdbot/extensions/dingtalk"

# 1. 检查 Clawdbot 是否已安装
echo -e "${YELLOW}[1/4] 检查 Clawdbot 安装...${NC}"
if ! command -v clawdbot &> /dev/null; then
    echo -e "${RED}错误: 未找到 clawdbot 命令，请先安装 Clawdbot${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Clawdbot 已安装${NC}"

# 2. 清理旧版本
echo -e "${YELLOW}[2/4] 清理旧版本...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    echo -e "${GREEN}✓ 已清理旧版本${NC}"
fi

# 3. 复制文件（不编译，直接复制 TypeScript 源码）
echo -e "${YELLOW}[3/4] 安装插件文件...${NC}"
mkdir -p "$INSTALL_DIR"

# 只复制必要的文件
cp index.ts "$INSTALL_DIR/"
cp -r src "$INSTALL_DIR/"
cp package.json "$INSTALL_DIR/"
cp clawdbot.plugin.json "$INSTALL_DIR/"

# 创建一个最小化的 package.json（不包含 devDependencies）
cat > "$INSTALL_DIR/package.json" << 'EOF'
{
  "name": "@clawdbot/dingtalk",
  "version": "1.0.0",
  "type": "module",
  "description": "DingTalk Stream mode channel plugin for Clawdbot",
  "clawdbot": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "dingtalk",
      "label": "DingTalk",
      "order": 80
    }
  },
  "dependencies": {
    "@alicloud/dingtalk": "^2.0.0",
    "@alicloud/openapi-client": "^0.4.0"
  }
}
EOF

echo -e "${GREEN}✓ 插件文件已安装到 $INSTALL_DIR${NC}"

# 4. 重启 Clawdbot Gateway
echo -e "${YELLOW}[4/4] 重启 Clawdbot Gateway...${NC}"
if systemctl is-active --quiet clawdbot-gateway.service; then
    systemctl restart clawdbot-gateway.service
    echo -e "${GREEN}✓ Clawdbot Gateway 已重启${NC}"
else
    echo -e "${YELLOW}! Clawdbot Gateway 服务未运行，请手动启动${NC}"
fi

# 完成
echo ""
echo "================================================"
echo -e "${GREEN}  ✅ 安装完成！${NC}"
echo "================================================"
echo ""
echo "⚠️  注意事项："
echo "  - 插件已安装为 TypeScript 源码（Clawdbot 会自动编译）"
echo "  - 无需手动安装依赖，Clawdbot 会处理"
echo ""
echo "下一步："
echo "  1. 编辑 ~/.clawdbot/clawdbot.json 添加钉钉通道配置"
echo "  2. 参考 clawdbot.json.example 配置示例"
echo "  3. 运行 'systemctl restart clawdbot-gateway' 重启服务"
echo ""
echo "查看日志："
echo "  journalctl -u clawdbot-gateway.service -f | grep dingtalk"
echo ""
echo "⚠️  当前限制："
echo "  - Stream SDK 集成尚未完成（占位符状态）"
echo "  - 等待钉钉官方 Node.js Stream SDK 完整文档"
echo "  - 架构已正确，只需补充实际的 API 调用"
echo ""
