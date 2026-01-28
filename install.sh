#!/bin/bash
#
# 钉钉 Stream 通道插件安装脚本
# 用于将插件安装到 Clawdbot 的 extensions 目录
#

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}钉钉 Stream 通道插件安装${NC}"
echo -e "${GREEN}================================================${NC}"

# 检查是否在插件目录
if [ ! -f "package.json" ] || [ ! -f "index.ts" ]; then
  echo -e "${RED}错误: 请在插件根目录下运行此脚本${NC}"
  exit 1
fi

# 1. 安装依赖
echo -e "\n${YELLOW}步骤 1/4: 安装依赖...${NC}"
npm install

# 2. 编译 TypeScript（可选，因为 Clawdbot 会直接加载 .ts 文件）
echo -e "\n${YELLOW}步骤 2/4: 编译 TypeScript...${NC}"
npm run build

# 3. 复制到 Clawdbot extensions 目录
CLAWDBOT_EXTENSIONS="/usr/lib/node_modules/clawdbot/extensions/dingtalk"

echo -e "\n${YELLOW}步骤 3/4: 复制插件文件到 ${CLAWDBOT_EXTENSIONS}...${NC}"

# 创建目标目录
sudo mkdir -p "$CLAWDBOT_EXTENSIONS"

# 复制必要文件
sudo cp -r src "$CLAWDBOT_EXTENSIONS/"
sudo cp index.ts "$CLAWDBOT_EXTENSIONS/"
sudo cp clawdbot.plugin.json "$CLAWDBOT_EXTENSIONS/"
sudo cp package.json "$CLAWDBOT_EXTENSIONS/"
sudo cp -r node_modules "$CLAWDBOT_EXTENSIONS/"

# 如果有 dist 目录也复制
if [ -d "dist" ]; then
  sudo cp -r dist "$CLAWDBOT_EXTENSIONS/"
fi

echo -e "${GREEN}✓ 插件文件已复制${NC}"

# 4. 配置说明
echo -e "\n${YELLOW}步骤 4/4: 配置说明${NC}"
echo -e "
请在 ${GREEN}~/.clawdbot/clawdbot.json${NC} 中添加以下配置：

${YELLOW}{${NC}
  ${YELLOW}\"channels\": {${NC}
    ${YELLOW}\"dingtalk\": {${NC}
      ${GREEN}\"enabled\": true,${NC}
      ${GREEN}\"appKey\": \"your_app_key\",${NC}
      ${GREEN}\"appSecret\": \"your_app_secret\",${NC}
      ${GREEN}\"agentId\": \"your_agent_id\",${NC}
      ${GREEN}\"streamEndpoint\": \"wss://connect-api.dingtalk.com/stream\",${NC}
      ${GREEN}\"groupPolicy\": \"open\",${NC}
      ${GREEN}\"dm\": {${NC}
        ${GREEN}\"enabled\": true,${NC}
        ${GREEN}\"allowFrom\": [\"*\"]${NC}
      ${GREEN}}${NC}
    ${YELLOW}}${NC}
  ${YELLOW}}${NC}
${YELLOW}}${NC}

然后运行: ${GREEN}clawdbot gateway restart${NC}
"

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}✅ 安装完成！${NC}"
echo -e "${GREEN}================================================${NC}"
