# Clawdbot DingTalk Stream 通道插件

✅ **完全实现** - 基于钉钉官方 Stream SDK 的 Clawdbot 通道插件

[![DingTalk](https://img.shields.io/badge/DingTalk-Stream%20Mode-blue)](https://open.dingtalk.com)
[![Clawdbot](https://img.shields.io/badge/Clawdbot-Channel%20Plugin-green)](https://github.com/clawdbot/clawdbot)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)](https://github.com/wendell1224/channel_dingtalk_for_clawdbot)

**无需公网 IP**，通过 WebSocket 长连接实时接收和响应钉钉消息。

## 📋 实现状态

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| ✅ Stream 连接 | **已实现** | 基于官方 `dingtalk-stream` SDK |
| ✅ 消息接收 | **已实现** | 实时接收单聊和群聊消息 |
| ✅ 消息发送 | **已实现** | sessionWebhook + access token |
| ✅ @提醒 | **已实现** | 群聊中支持 @用户回复 |
| ✅ 权限控制 | **已实现** | 群聊白名单、私聊权限 |
| ✅ Token管理 | **已实现** | 自动缓存和刷新（2小时TTL） |
| ✅ 自动重连 | **已实现** | 网络断开自动恢复 |
| ✅ 消息确认 | **已实现** | 避免重复接收 |
| ✅ 错误处理 | **已实现** | 完整的异常捕获和日志 |
| ⏸️ 卡片消息 | **规划中** | 交互式卡片支持 |
| ⏸️ 流式卡片 | **规划中** | AICardReplier 流式响应 |

**当前版本：生产就绪（Production Ready）**

## ✨ 功能特性

### ✅ 已实现（Production Ready）

- 🚀 **实时消息接收** - 基于官方 `dingtalk-stream` SDK 的 WebSocket 连接
- 💬 **智能消息回复** - 支持文本和 Markdown 格式自动回复
- 🎯 **@提醒支持** - 群聊中正确处理和响应 @机器人
- 🔄 **自动重连机制** - 网络断开自动重连，保证服务稳定
- 🛡️ **权限控制** - 群聊白名单、私聊权限、提及检测
- 🔐 **Token 管理** - 自动缓存和刷新 Access Token（2小时有效期）
- 📊 **完整日志** - 详细的运行日志和错误追踪
- 🎊 **消息确认** - 避免重复接收和处理消息

### 🎯 核心优势

1. **零配置网络** - 不需要公网 IP、端口映射或 Webhook 配置
2. **官方 SDK** - 使用钉钉官方维护的 Node.js Stream SDK
3. **标准架构** - 完全符合 Clawdbot Channel Plugin 规范
4. **生产就绪** - 经过完整测试，可直接用于生产环境

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                     钉钉服务器                                │
└────────────────────┬────────────────────────────────────────┘
                     │ WebSocket (Stream Mode)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              dingtalk-stream SDK (官方)                      │
│  • DWClient - WebSocket 客户端                               │
│  • TOPIC_ROBOT - 消息主题订阅                                │
│  • EventAck - 消息确认                                       │
└────────────────────┬────────────────────────────────────────┘
                     │ 消息事件回调
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           本插件核心模块                                      │
│  • monitor.ts - Stream 连接管理                              │
│  • bot.ts - 消息解析和路由                                   │
│  • send.ts - 消息发送 (sessionWebhook + token)              │
│  • channel.ts - Clawdbot Channel 接口                       │
└────────────────────┬────────────────────────────────────────┘
                     │ 标准 Clawdbot API
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  Clawdbot Agent                             │
│  • Claude/GPT 等 AI 模型处理                                │
│  • 上下文管理和历史记录                                      │
│  • 工具调用和函数执行                                        │
└────────────────────┬────────────────────────────────────────┘
                     │ 回复文本
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           sessionWebhook API (钉钉)                         │
│  • 通过 webhook 发送回复                                     │
│  • 支持 @提醒                                               │
└────────────────────┬────────────────────────────────────────┘
                     ↓
                  用户收到回复
```

## 📦 快速开始

### 🚀 一键部署（服务器端）

如果你已经克隆了代码到服务器的 `/tmp/channel_dingtalk_for_clawdbot`：

```bash
cd /tmp/channel_dingtalk_for_clawdbot
sudo bash deploy-update.sh
```

这个脚本会自动完成：
- ✅ 拉取最新代码
- ✅ 安装依赖（包括 `dingtalk-stream` SDK）
- ✅ 编译 TypeScript
- ✅ 备份旧版本
- ✅ 安装新版本
- ✅ 重启 Clawdbot Gateway
- ✅ 显示实时日志

### 📥 首次安装

```bash
# 1. 克隆项目到服务器
cd /tmp
git clone https://github.com/wendell1224/channel_dingtalk_for_clawdbot.git
cd channel_dingtalk_for_clawdbot

# 2. 运行自动部署脚本
sudo bash deploy-update.sh
```

## ⚙️ 配置

### 1. 获取钉钉应用凭证

1. 访问 [钉钉开放平台](https://open-dev.dingtalk.com)
2. 创建或打开你的应用
3. 获取以下信息：
   - **AppKey** (Client ID)
   - **AppSecret** (Client Secret)
   - **AgentId** (企业内部应用)
4. 在应用配置中**启用 Stream 模式**

### 2. 配置 Clawdbot

编辑 `~/.clawdbot/clawdbot.json`，添加钉钉通道配置：

```json
{
  "channels": {
    "dingtalk": {
      "enabled": true,
      "appKey": "dingxxx...",
      "appSecret": "your_app_secret",
      "agentId": "your_agent_id",
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

### 3. 重启 Clawdbot

```bash
clawdbot gateway restart
```

### 4. 验证连接

查看日志确认 Stream 连接成功：

```bash
journalctl -u clawdbot-gateway.service -f | grep -i dingtalk
```

**✅ 成功的日志输出：**

```
[dingtalk] initializing Stream client with appKey: dingxxx...
[dingtalk] connecting to Stream server...
[dingtalk] ✅ Stream connection established successfully!
[dingtalk] waiting for messages...
```

**📨 收到消息时的日志：**

```
[dingtalk] received raw message: {"msgtype":"text"...
[dingtalk] received message from user123 in chat456 (p2p)
[dingtalk] dispatching to agent (session=...)
[dingtalk] reply sent to chat456
[dingtalk] message msg_123 processed successfully
```

## 📖 配置说明

### 基础配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | 是 | 是否启用通道 |
| `appKey` | string | 是 | 钉钉应用的 App Key |
| `appSecret` | string | 是 | 钉钉应用的 App Secret |
| `agentId` | string | 是 | 钉钉应用的 Agent ID |

### 高级配置

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `streamEndpoint` | string | `wss://connect-api.dingtalk.com/stream` | Stream 连接地址 |
| `groupPolicy` | string | `open` | 群聊策略: `open`=开放模式, `allowlist`=白名单模式 |
| `groupAllowFrom` | string[] | `[]` | 允许的群聊 ID 列表（仅当 groupPolicy=allowlist 时有效） |
| `dm.enabled` | boolean | `true` | 是否启用私聊 |
| `dm.allowFrom` | string[] | `["*"]` | 允许私聊的用户 ID 列表，`["*"]` 表示允许所有用户 |
| `heartbeatInterval` | number | `30000` | 心跳间隔（毫秒） |
| `reconnectInterval` | number | `5000` | 重连间隔（毫秒） |
| `cardTemplateId` | string | - | 流式卡片模板 ID（可选） |
| `cardContentKey` | string | `content` | 卡片内容字段名 |

## 🔧 权限控制

### 群聊权限

**开放模式**（推荐）：
```json
{
  "groupPolicy": "open"
}
```
允许机器人响应所有群聊消息。

**白名单模式**：
```json
{
  "groupPolicy": "allowlist",
  "groupAllowFrom": ["cidxxxx", "cidyyyy"]
}
```
仅响应指定群聊 ID 的消息。

### 私聊权限

**允许所有用户**：
```json
{
  "dm": {
    "enabled": true,
    "allowFrom": ["*"]
  }
}
```

**指定用户白名单**：
```json
{
  "dm": {
    "enabled": true,
    "allowFrom": ["user_id_1", "user_id_2"]
  }
}
```

**禁用私聊**：
```json
{
  "dm": {
    "enabled": false
  }
}
```

## 🚀 使用示例

### 基本消息响应

在钉钉群或私聊中 @机器人 发送消息，Clawdbot 会自动处理并回复。

### 流式卡片（可选）

如果你的应用支持流式卡片，可以配置 `cardTemplateId`:

```json
{
  "cardTemplateId": "your_template_id",
  "cardContentKey": "content"
}
```

参考：[钉钉流式卡片文档](https://open.dingtalk.com/document/dingstart/typewriter-effect-streaming-ai-card)

## 🛠️ 开发

### 项目结构

```
dingtalk-stream-channel/
├── index.ts                 # 插件入口
├── src/
│   ├── channel.ts          # Channel 实现
│   ├── stream-client.ts    # Stream 客户端
│   ├── message-sender.ts   # 消息发送器
│   ├── types.ts            # 类型定义
│   └── utils.ts            # 工具函数
├── assistant_ding/         # Python 参考实现
├── package.json
├── tsconfig.json
├── clawdbot.plugin.json
└── README.md
```

### 构建

```bash
npm run build    # 编译 TypeScript
npm run dev      # 监听模式
```

### 调试

查看 Clawdbot 日志：

```bash
# 查看实时日志
journalctl -u clawdbot-gateway.service -f

# 或查看日志文件
tail -f /tmp/clawdbot/clawdbot-$(date +%Y-%m-%d).log
```

## 📚 参考

- [Clawdbot Plugin SDK](https://docs.clawdbot.com/plugin-sdk)
- [钉钉 Stream 模式文档](https://open.dingtalk.com/document/development/introduction-to-stream-mode)
- [钉钉 Stream SDK Python](https://github.com/open-dingtalk/dingtalk-stream-sdk-python)
- [Python 参考实现](./assistant_ding/README.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
