#!/bin/bash
#
# 在服务器上运行此脚本来查看 telegram channel 的接口
#

echo "========== 查找 Clawdbot 安装位置 =========="
CLAWDBOT_PATH=$(find /usr /opt /home -name "clawdbot" -type d -path "*/node_modules/*" 2>/dev/null | head -1)
echo "Clawdbot 路径: $CLAWDBOT_PATH"

if [ -z "$CLAWDBOT_PATH" ]; then
    echo "错误: 找不到 Clawdbot 安装目录"
    exit 1
fi

BASE_DIR=$(dirname "$CLAWDBOT_PATH")
echo "Base 目录: $BASE_DIR"

echo ""
echo "========== Telegram 扩展结构 =========="
find "$BASE_DIR/clawdbot/extensions/telegram" -type f -name "*.ts" -o -name "*.js" | head -20

echo ""
echo "========== Telegram channel.ts =========="
CHANNEL_FILE=$(find "$BASE_DIR/clawdbot/extensions/telegram" -name "channel.ts" -o -name "channel.js" | head -1)
if [ -f "$CHANNEL_FILE" ]; then
    echo "文件: $CHANNEL_FILE"
    head -100 "$CHANNEL_FILE"
else
    echo "找不到 channel.ts/js"
fi

echo ""
echo "========== Telegram index.ts =========="
INDEX_FILE="$BASE_DIR/clawdbot/extensions/telegram/index.ts"
if [ -f "$INDEX_FILE" ]; then
    cat "$INDEX_FILE"
else
    echo "找不到 index.ts"
fi

echo ""
echo "========== Discord channel 实现 =========="
DISCORD_CHANNEL=$(find "$BASE_DIR/clawdbot/extensions/discord" -name "channel.ts" -o -name "channel.js" | head -1)
if [ -f "$DISCORD_CHANNEL" ]; then
    echo "文件: $DISCORD_CHANNEL"
    head -100 "$DISCORD_CHANNEL"
fi

echo ""
echo "========== 查看 Channel 接口定义 =========="
find "$BASE_DIR/clawdbot" -name "*.d.ts" -exec grep -l "interface.*Channel" {} \; | head -5
