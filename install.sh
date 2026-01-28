#!/bin/bash

# Clawdbot 钉钉 Stream 通道插件安装脚本

set -e

echo "========================================"
echo "Clawdbot 钉钉 Stream 通道插件安装"
echo "========================================"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js >= 18"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ 错误: Node.js 版本过低，需要 >= 18，当前: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $(node -v)"

# 安装依赖
echo "📦 正在安装依赖..."
npm install

# 编译 TypeScript
echo "🔨 正在编译 TypeScript..."
npm run build

# 创建目标目录
CLAWDBOT_DIR="${HOME}/.clawdbot"
PLUGIN_DIR="${CLAWDBOT_DIR}/plugins/dingtalk"

echo "📁 创建插件目录..."
mkdir -p "${CLAWDBOT_DIR}/plugins"

# 复制文件
echo "📋 复制插件文件..."
if [ -d "${PLUGIN_DIR}" ]; then
    echo "⚠️  检测到已存在的插件目录，正在备份..."
    mv "${PLUGIN_DIR}" "${PLUGIN_DIR}.backup.$(date +%Y%m%d%H%M%S)"
fi

mkdir -p "${PLUGIN_DIR}"

# 复制必要的文件和目录
cp -r "$(pwd)/dist" "${PLUGIN_DIR}/"
cp "$(pwd)/package.json" "${PLUGIN_DIR}/"
cp "$(pwd)/README.md" "${PLUGIN_DIR}/"
cp -r "$(pwd)/node_modules" "${PLUGIN_DIR}/" || echo "⚠️  node_modules 未复制，请确保在目标位置运行 npm install"

echo ""
echo "========================================"
echo "✅ 安装完成！"
echo "========================================"
echo ""
echo "📝 下一步："
echo ""
echo "1. 复制配置示例到你的 Clawdbot 配置文件："
echo "   cp clawdbot.json.example ~/clawdbot.json.example"
echo ""
echo "2. 编辑 ~/.clawdbot/clawdbot.json，添加钉钉通道配置："
echo "   记得替换 AppKey、AppSecret、AgentId 为你的实际值"
echo ""
echo "3. 重启 Clawdbot Gateway："
echo "   clawdbot gateway restart"
echo ""
echo "📚 更多信息请参考 README.md"
echo ""
