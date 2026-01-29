# Clawdbot DingTalk Stream 通道插件

基于钉钉 Stream 模式的 Clawdbot 通道插件，**无需公网 IP**，通过长连接实时接收钉钉消息。

## ✨ 特性

- 🚀 **即插即用** - 符合 Clawdbot Channel Plugin 规范，安装即可使用
- 🔒 **无需公网 IP** - 使用钉钉 Stream 模式，通过长连接接收消息
- 💬 **完整消息支持** - 支持文本、Markdown、卡片等多种消息类型
- 🔄 **自动重连** - 网络断开自动重连，保证服务稳定
- 🛡️ **权限控制** - 支持群聊白名单、私聊权限管理
- 📊 **流式响应** - 支持钉钉 AICardReplier 流式卡片（可选）

## 📦 安装

### 方法 1: 使用安装脚本（推荐）

```bash
# 克隆项目
git clone https://github.com/your-repo/dingtalk-stream-channel.git
cd dingtalk-stream-channel

# 运行安装脚本
sudo bash install.sh
```

### 方法 2: 手动安装

```bash
# 1. 构建项目
npm install
npm run build

# 2. 复制到 Clawdbot 扩展目录
sudo mkdir -p /usr/lib/node_modules/clawdbot/extensions/dingtalk-stream
sudo cp -r dist node_modules package.json index.ts clawdbot.plugin.json \
  /usr/lib/node_modules/clawdbot/extensions/dingtalk-stream/

# 3. 重启 Clawdbot Gateway
clawdbot gateway restart
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
