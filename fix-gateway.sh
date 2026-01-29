#!/bin/bash
# 修复 Clawdbot Gateway 端口占用问题

echo "🔧 正在修复 Clawdbot Gateway 启动问题..."
echo ""

# 1. 停止 systemd 服务
echo "1️⃣ 停止 systemd 服务..."
sudo systemctl stop clawdbot-gateway.service
sleep 2

# 2. 查找并杀死所有 clawdbot gateway 进程
echo "2️⃣ 清理残留进程..."
PIDS=$(ps aux | grep 'clawdbot gateway' | grep -v grep | awk '{print $2}')
if [ -n "$PIDS" ]; then
  echo "   找到进程: $PIDS"
  sudo kill -9 $PIDS
  sleep 1
  echo "   ✅ 进程已清理"
else
  echo "   ℹ️  没有找到残留进程"
fi

# 3. 检查端口 18789
echo "3️⃣ 检查端口 18789..."
PORT_PID=$(sudo lsof -ti:18789 2>/dev/null)
if [ -n "$PORT_PID" ]; then
  echo "   端口 18789 被进程 $PORT_PID 占用，正在清理..."
  sudo kill -9 $PORT_PID
  sleep 1
  echo "   ✅ 端口已释放"
else
  echo "   ✅ 端口 18789 空闲"
fi

# 4. 重新启动服务
echo "4️⃣ 启动 Clawdbot Gateway..."
sudo systemctl start clawdbot-gateway.service
sleep 3

# 5. 检查状态
echo "5️⃣ 检查服务状态..."
sudo systemctl status clawdbot-gateway.service --no-pager | head -20

echo ""
echo "================================================"
echo "✅ 修复完成！"
echo ""
echo "查看实时日志："
echo "  journalctl -u clawdbot-gateway.service -f"
echo ""
echo "查看钉钉插件日志："
echo "  journalctl -u clawdbot-gateway.service -f | grep dingtalk"
echo "================================================"
