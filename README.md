# Clawdbot 钉钉 Stream 通道插件

> 通过钉钉 Stream 模式实现长连接，无需公网 IP 即可接收实时消息

[![npm version](https://badge.fury.io/js/@clawdbot/channel-dingtalk.svg)](https://www.npmjs.com/package/@clawdbot/channel-dingtalk)
[![License](https://img.shields.io/npm/l/@clawdbot/channel-dingtalk.svg)](LICENSE)

## 🚀 特性

- ✅ **无需公网 IP** - 内网也能部署
- ⚡ **长连接实时推送** - 毫秒级响应
- 🔄 **自动重连** - 断线自动恢复
- 🎯 **权限控制** - 支持群聊/私聊白名单
- 💬 **多消息类型** - 文本、Markdown、卡片
- 📊 **连接统计** - 实时监控连接状态
- 🛡️ **频率限制** - 防止消息发送过快

## 📦 安装

### 方法一：使用安装脚本（推荐）

```bash
# 克隆仓库
git clone https://github.com/wendell1224/channel_dingtalk_for_clawdbot.git
cd channel_dingtalk_for_clawdbot

# 运行安装脚本
bash install.sh
```

### 方法二：手动安装到 Clawdbot Extensions 目录

```bash
# 1. 克隆仓库
git clone https://github.com/wendell1224/channel_dingtalk_for_clawdbot.git
cd channel_dingtalk_for_clawdbot

# 2. 安装依赖并编译
npm install
npm run build

# 3. 创建扩展目录
sudo mkdir -p /usr/lib/node_modules/clawdbot/extensions/dingtalk

# 4. 复制所有必要文件
sudo cp -r src /usr/lib/node_modules/clawdbot/extensions/dingtalk/
sudo cp index.ts /usr/lib/node_modules/clawdbot/extensions/dingtalk/
sudo cp clawdbot.plugin.json /usr/lib/node_modules/clawdbot/extensions/dingtalk/
sudo cp package.json /usr/lib/node_modules/clawdbot/extensions/dingtalk/
sudo cp -r node_modules /usr/lib/node_modules/clawdbot/extensions/dingtalk/
```

### 方法三：使用安装脚本（推荐）

```bash
chmod +x install.sh
sudo ./install.sh
```

安装脚本会自动完成上述所有步骤。

## ⚙️ 配置

编辑 `~/.clawdbot/clawdbot.json`：

```json
{
  "channels": {
    "dingtalk": {
      "enabled": true,
      "appKey": "你的AppKey",
      "appSecret": "你的AppSecret",
      "agentId": "你的AgentId",
      "streamEndpoint": "wss://connect-api.dingtalk.com/stream",
      "groupPolicy": "allowlist",
      "groupAllowFrom": ["群OpenConversationId1", "群OpenConversationId2"],
      "dm": {
        "enabled": true,
        "allowFrom": ["用户UserId1", "用户UserId2"]
      },
      "heartbeatInterval": 30000,
      "reconnectInterval": 5000
    }
  }
}
```

### 配置说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `enabled` | boolean | 是 | 是否启用通道 |
| `appKey` | string | 是 | 钉钉应用 AppKey |
| `appSecret` | string | 是 | 钉钉应用 AppSecret |
| `agentId` | string | 是 | 钉钉应用 AgentId |
| `streamEndpoint` | string | 否 | Stream 接入地址，默认 `wss://connect-api.dingtalk.com/stream` |
| `groupPolicy` | string | 是 | 群聊策略：`allowlist`（白名单）或 `open`（开放） |
| `groupAllowFrom` | string[] | 否 | 允许的群 OpenConversationId 列表 |
| `dm.enabled` | boolean | 否 | 是否启用私聊 |
| `dm.allowFrom` | string[] | 否 | 允许私聊的用户 UserId 列表 |
| `heartbeatInterval` | number | 否 | 心跳间隔（毫秒），默认 30000 |
| `reconnectInterval` | number | 否 | 重连间隔（毫秒），默认 5000 |

## 🔧 钉钉应用配置

### 1. 创建企业内部应用

登录 [钉钉开放平台](https://open.dingtalk.com/)，创建企业内部应用。

### 2. 获取应用信息

记录以下信息：
- **AppKey**
- **AppSecret**
- **AgentId**

### 3. 配置应用权限

进入「权限管理」，添加以下权限：

| 权限名称 | 权限值 |
|---------|--------|
| 通讯录读权限 | `contact:user.base:readonly` |
| 读取群组信息 | `im:group:readonly` |
| 发送消息到群聊 | `im:group:msg` |
| 发送消息到单聊 | `im:chat:msg` |

### 4. 启用 Stream 模式

进入「开发管理」，找到「事件订阅」，选择「Stream 模式」。

## 📝 使用

### 启动 Gateway

```bash
clawdbot gateway restart
```

### 查看日志

```bash
# Linux
tail -f ~/.clawdbot/gateway.log | grep -i dingtalk

# macOS
./scripts/clawlog.sh -f | grep -i dingtalk
```

### 在钉钉中测试

- 打开已授权的群聊
- 发送消息：`@小龙虾 你好`
- 查看机器人是否回复

## 🔍 API 文档

### DingTalkChannel

```typescript
interface DingTalkChannel {
  id: string;
  name: string;
  start(config: DingTalkConfig, gateway: Gateway): Promise<void>;
  stop(): Promise<void>;
  sendMessage(chatId: string, text: string, isGroup: boolean): Promise<void>;
  sendMessageWithOptions(chatId: string, text: string, options: SendMessageOptions): Promise<void>;
  sendMarkdown(chatId: string, title: string, text: string, isGroup: boolean): Promise<void>;
  sendCard(chatId: string, cardContent: any, isGroup: boolean): Promise<void>;
  getStats(): ConnectionStats;
}
```

### ConnectionStats

```typescript
interface ConnectionStats {
  status: ConnectionStatus;
  connectedAt?: Date;
  lastError?: string;
  reconnectCount: number;
  messagesReceived: number;
  messagesSent: number;
}
```

## 🐛 故障排查

### 连接失败

1. 检查 AppKey 和 AppSecret 是否正确
2. 确认应用权限已正确配置
3. 检查防火墙是否允许出站连接到 `connect-api.dingtalk.com:443`

### 收不到消息

1. 检查 `groupAllowFrom` 和 `dm.allowFrom` 是否包含正确的 ID
2. 在群中 @ 机器人（确保机器人被添加到群中）
3. 查看日志是否有权限警告

### 发送消息失败

1. 检查 AgentId 是否正确
2. 确认机器人有发送消息权限
3. 查看是否有频率限制

## 📚 相关资源

- [钉钉开放平台文档](https://open.dingtalk.com/)
- [钉钉 Stream 模式介绍](https://open.dingtalk.com/document/development/introduction-to-stream-mode)
- [Clawdbot 官方文档](https://docs.clawd.bot)
- [Clawdbot Discord 社区](https://discord.com/invite/clawd)

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 👨‍💻 作者

小龙虾助手 🦞

---

Made with ❤️ by Clawdbot
