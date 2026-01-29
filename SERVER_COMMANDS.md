# 🚀 服务器部署命令（复制粘贴即可）

## ⚡ 快速部署（推荐）

在服务器上复制并运行以下完整命令块：

```bash
# 进入项目目录并更新
cd /tmp/channel_dingtalk_for_clawdbot && \
git pull origin main && \
sudo bash deploy-update.sh
```

就这么简单！脚本会自动完成所有步骤。

---

## 📋 部署后验证

### 1. 查看实时日志

```bash
journalctl -u clawdbot-gateway.service -f | grep -i dingtalk
```

### 2. 预期看到的成功日志

```
✅ [dingtalk] initializing Stream client with appKey: dingxxx...
✅ [dingtalk] connecting to Stream server...
✅ [dingtalk] ✅ Stream connection established successfully!
✅ [dingtalk] waiting for messages...
```

### 3. 如果看到错误

查看完整日志：

```bash
journalctl -u clawdbot-gateway.service -n 100 --no-pager | grep -A 5 -B 5 dingtalk
```

---

## 🧪 测试命令

### 单聊测试

1. 在钉钉中找到你的机器人
2. 发送消息："你好"
3. 查看服务器日志应该看到：

```bash
# 服务器上运行
journalctl -u clawdbot-gateway.service -f

# 预期日志
[dingtalk] received raw message: {"msgtype":"text"...
[dingtalk] received message from user123 in chat456 (p2p)
[dingtalk] dispatching to agent (session=...)
[dingtalk] reply sent to chat456
[dingtalk] message msg_123 processed successfully
```

### 群聊测试

1. 将机器人添加到群聊
2. @机器人："@机器人 介绍一下你自己"
3. 查看日志确认收到并回复

---

## 🔧 常用管理命令

```bash
# 重启服务
sudo systemctl restart clawdbot-gateway

# 停止服务
sudo systemctl stop clawdbot-gateway

# 启动服务
sudo systemctl start clawdbot-gateway

# 查看服务状态
sudo systemctl status clawdbot-gateway

# 查看最近 200 条日志
journalctl -u clawdbot-gateway.service -n 200 --no-pager

# 查看今天的所有日志
journalctl -u clawdbot-gateway.service --since today

# 查看钉钉相关日志
journalctl -u clawdbot-gateway.service --since today | grep dingtalk
```

---

## 🆘 故障排查

### 问题 1: 连接失败

```bash
# 检查配置
cat ~/.clawdbot/clawdbot.json | grep -A 10 dingtalk

# 检查插件安装
ls -la /usr/lib/node_modules/clawdbot/extensions/dingtalk/

# 检查依赖
cd /usr/lib/node_modules/clawdbot/extensions/dingtalk/
npm list dingtalk-stream
```

### 问题 2: 收不到消息

```bash
# 查看详细日志
journalctl -u clawdbot-gateway.service -f

# 检查网络连接
ping -c 3 connect-api.dingtalk.com

# 重启服务试试
sudo systemctl restart clawdbot-gateway
```

### 问题 3: 回复失败

```bash
# 查看错误日志
journalctl -u clawdbot-gateway.service | grep -i error | tail -20

# 检查 access token
journalctl -u clawdbot-gateway.service | grep -i "access token"
```

---

## 📚 完整文档

项目中提供了完整的文档：

| 文档文件 | 用途 |
|---------|------|
| `README.md` | 完整使用指南 |
| `DEPLOY.md` | 详细部署步骤 |
| `SUCCESS.md` | 实现总结 |
| `IMPLEMENTATION_COMPLETE.md` | 技术细节 |
| `READY_TO_DEPLOY.md` | 快速参考 |

在服务器上查看：

```bash
cd /tmp/channel_dingtalk_for_clawdbot
cat DEPLOY.md
```

---

## ✅ 部署检查清单

部署前：
- [x] ✅ 代码已推送到 GitHub
- [x] ✅ 配置文件已准备好 (`~/.clawdbot/clawdbot.json`)
- [ ] ⏳ 已在钉钉开放平台启用 Stream 模式

部署后：
- [ ] ⏳ Stream 连接建立成功（查看日志）
- [ ] ⏳ 单聊测试通过
- [ ] ⏳ 群聊测试通过
- [ ] ⏳ @提醒功能正常

---

## 🎉 完成！

一切就绪，现在可以开始使用 DingTalk AI 助手了！

有任何问题请查看文档或日志。

**祝使用愉快！** 🚀
