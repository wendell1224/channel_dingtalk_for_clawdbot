# 快速开始指南

本指南帮助你在 5 分钟内完成钉钉 Stream 通道的安装和配置。

## 📋 前置要求

- 已安装 Clawdbot
- 有钉钉开发者账号
- 已创建钉钉应用并启用 Stream 模式

## 🚀 快速安装（3 步）

### 1. 安装插件

```bash
git clone https://github.com/your-repo/dingtalk-stream-channel.git
cd dingtalk-stream-channel
sudo bash install.sh
```

### 2. 配置凭证

编辑 `~/.clawdbot/clawdbot.json`，添加：

```json
{
  "channels": {
    "dingtalk": {
      "enabled": true,
      "appKey": "你的AppKey",
      "appSecret": "你的AppSecret", 
      "agentId": "你的AgentId",
      "groupPolicy": "open",
      "dm": {
        "enabled": true,
        "allowFrom": ["*"]
      }
    }
  }
}
```

### 3. 重启服务

```bash
clawdbot gateway restart
```

## ✅ 验证

在钉钉中 @你的机器人 发送消息，如果收到回复说明配置成功！

## 📊 查看日志

```bash
# 实时查看日志
journalctl -u clawdbot-gateway.service -f

# 搜索钉钉相关日志
journalctl -u clawdbot-gateway.service | grep DingTalk
```

## 🔧 常见问题

### 连接失败？

检查：
1. AppKey、AppSecret、AgentId 是否正确
2. 钉钉应用是否启用了 Stream 模式
3. 网络是否正常

### 没有收到消息？

检查：
1. 机器人是否在群里
2. 是否正确 @ 了机器人
3. `groupPolicy` 配置是否正确

### 需要更多帮助？

查看完整文档：[README.md](./README.md)

## 🎯 下一步

- 配置群聊白名单
- 配置私聊权限
- 启用流式卡片
- 集成自定义 AI 模型

详见 [README.md](./README.md) 的高级配置部分。
