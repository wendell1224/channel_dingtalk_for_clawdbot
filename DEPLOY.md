# 🚀 DingTalk Stream 插件部署指南

## ✅ 已完成的功能

✨ **完整实现了 DingTalk Stream 模式**

1. **实时消息接收** - 通过官方 `dingtalk-stream` SDK 建立 WebSocket 连接
2. **消息发送** - 使用 sessionWebhook API 发送文本和 Markdown 消息
3. **@提醒支持** - 群聊中正确处理和响应 @机器人
4. **访问令牌管理** - 自动缓存和刷新 access token（2小时有效期）
5. **消息确认机制** - 避免重复接收消息

## 📦 在服务器上部署

### 1. 拉取最新代码

```bash
cd /tmp/channel_dingtalk_for_clawdbot
git pull origin main
```

### 2. 安装新依赖

```bash
npm install
```

**新增的依赖：**
- `dingtalk-stream@^1.5.0` - 官方 Stream SDK
- `axios@^1.6.0` - HTTP 客户端

### 3. 编译 TypeScript

```bash
npm run build
```

### 4. 安装到 Clawdbot

使用提供的安装脚本：

```bash
sudo bash install.sh
```

或者手动安装：

```bash
# 复制到插件目录
sudo rm -rf /usr/lib/node_modules/clawdbot/extensions/dingtalk
sudo mkdir -p /usr/lib/node_modules/clawdbot/extensions/dingtalk
sudo cp -r dist/* /usr/lib/node_modules/clawdbot/extensions/dingtalk/
sudo cp package.json /usr/lib/node_modules/clawdbot/extensions/dingtalk/
sudo cp clawdbot.plugin.json /usr/lib/node_modules/clawdbot/extensions/dingtalk/

# 安装依赖
cd /usr/lib/node_modules/clawdbot/extensions/dingtalk
sudo npm install --production
```

### 5. 重启 Clawdbot Gateway

```bash
sudo systemctl restart clawdbot-gateway
```

### 6. 查看日志确认连接

```bash
journalctl -u clawdbot-gateway.service -f | grep -i dingtalk
```

## ✅ 预期日志输出

成功启动时应该看到：

```
[dingtalk] initializing Stream client with appKey: dingba0vqbxihohi2qvt
[dingtalk] connecting to Stream server...
[dingtalk] ✅ Stream connection established successfully!
[dingtalk] waiting for messages...
```

收到消息时：

```
[dingtalk] received raw message: {"msgtype":"text","text":{"content":"你好"}...
[dingtalk] received message from user123 in chat456 (p2p)
[dingtalk] dispatching to agent (session=...)
[dingtalk] reply sent to chat456
[dingtalk] message msg_123 processed successfully
```

## 🔧 配置说明

你当前的配置（`~/.clawdbot/clawdbot.json`）：

```json
{
  "channels": {
    "dingtalk": {
      "enabled": true,
      "appKey": "dingba0vqbxihohi2qvt",
      "appSecret": "9oJ10GNXSJBDNLviM7vOyGXNgBAPAmA20VlU3a4VeFioZ9Ne4M4KwBhD2L5Kz0jh",
      "agentId": "4220221170",
      "streamEndpoint": "wss://connect-api.dingtalk.com/stream",
      "groupPolicy": "open",
      "dm": {
        "enabled": true,
        "allowFrom": ["*"]
      },
      "heartbeatInterval": 30000,
      "reconnectInterval": 5000
    }
  }
}
```

**配置项说明：**

- `enabled`: 是否启用钉钉通道
- `appKey`/`appSecret`: 钉钉应用凭证
- `agentId`: 企业内部应用 ID
- `groupPolicy`: 群聊策略
  - `"open"` - 任何人 @机器人都可以触发
  - `"allowlist"` - 只允许 `groupAllowFrom` 中的群聊
- `dm.enabled`: 是否启用私聊
- `dm.allowFrom`: 私聊白名单，`["*"]` 表示允许所有人

## 📝 测试步骤

### 1. 单聊测试

1. 在钉钉中找到你的机器人
2. 发送消息："你好"
3. 机器人应该回复

### 2. 群聊测试

1. 把机器人拉入群聊
2. @机器人并发送消息："@小龙虾 你好"
3. 机器人应该回复并 @你

## 🐛 故障排查

### 问题 1: 连接失败

**日志：** `Failed to initialize Stream client`

**解决：**
1. 检查 `appKey` 和 `appSecret` 是否正确
2. 检查网络连接
3. 确认钉钉应用状态正常

### 问题 2: 收不到消息

**可能原因：**
1. 机器人未开通 Stream 模式
2. 权限不足（检查钉钉开放平台的权限配置）
3. 群聊中未 @机器人（`groupPolicy: "open"` 需要 @）

**排查：**
```bash
# 查看详细日志
journalctl -u clawdbot-gateway.service -n 200 --no-pager | grep dingtalk
```

### 问题 3: 回复失败

**日志：** `failed to send reply`

**解决：**
1. 检查 `sessionWebhook` 是否正确传递
2. 确认 access token 获取正常
3. 检查网络连接到钉钉 API

## 🎯 架构说明

### 消息流程

```
钉钉服务器 
  ↓ (WebSocket)
DWClient (dingtalk-stream SDK)
  ↓ (TOPIC_ROBOT 回调)
monitorDingTalkProvider
  ↓
handleDingTalkMessage
  ↓
Clawdbot Agent 处理
  ↓
dispatcher (sendMessageDingTalk)
  ↓ (sessionWebhook + access token)
钉钉 API
  ↓
用户收到回复
```

### 核心文件

- `src/monitor.ts` - Stream 连接管理
- `src/send.ts` - 消息发送（sessionWebhook + access token）
- `src/bot.ts` - 消息处理和路由
- `src/channel.ts` - Clawdbot Channel 接口实现
- `src/accounts.ts` - 凭证管理
- `src/runtime.ts` - Runtime 环境

## 📚 参考资料

- [DingTalk Stream SDK (Node.js)](https://github.com/open-dingtalk/dingtalk-stream-sdk-nodejs)
- [钉钉机器人开发教程](https://open-dingtalk.github.io/developerpedia/docs/explore/tutorials/stream/bot/nodejs/build-bot/)
- [Clawdbot Plugin SDK](https://github.com/clawdbot/clawdbot)

## 🎊 完成！

插件现在已经完全可用。你可以：

1. ✅ 接收钉钉单聊和群聊消息
2. ✅ 通过 Clawdbot Agent 处理消息
3. ✅ 自动回复到钉钉
4. ✅ 支持 @提醒
5. ✅ 支持 Markdown 格式

开始享受你的钉钉 AI 助手吧！🚀
