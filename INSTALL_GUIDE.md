# 🚀 快速安装指南

## ✅ 关键发现

Clawdbot 的 channel 插件必须安装到 **`/usr/lib/node_modules/clawdbot/extensions/`** 目录，不是 `~/.clawdbot/plugins` 或 `~/.clawdbot/channels`！

插件使用 **TypeScript 扩展系统**，需要：
1. `index.ts` - 插件入口，使用 `api.registerChannel()` 注册
2. `clawdbot.plugin.json` - 插件元数据
3. `package.json` 中的 `"clawdbot": { "extensions": ["./index.ts"] }`

---

## 📦 服务器安装步骤

在你的 **Linux 服务器** 上执行：

```bash
# 1. 进入临时目录
cd /tmp

# 2. 拉取最新代码
rm -rf channel_dingtalk_for_clawdbot
git clone https://github.com/wendell1224/channel_dingtalk_for_clawdbot.git
cd channel_dingtalk_for_clawdbot

# 3. 运行安装脚本
chmod +x install.sh
sudo ./install.sh

# 4. 重启 Clawdbot Gateway
clawdbot gateway restart
```

---

## 🔍 验证安装

```bash
# 检查插件文件是否存在
ls -la /usr/lib/node_modules/clawdbot/extensions/dingtalk/

# 应该看到：
# - index.ts
# - clawdbot.plugin.json
# - package.json
# - src/
# - node_modules/
```

---

## 📝 配置文件

编辑 `~/.clawdbot/clawdbot.json`，确保有 `channels.dingtalk` 配置：

```json
{
  "channels": {
    "dingtalk": {
      "enabled": true,
      "appKey": "你的AppKey",
      "appSecret": "你的AppSecret",
      "agentId": "你的AgentId",
      "streamEndpoint": "wss://connect-api.dingtalk.com/stream",
      "groupPolicy": "open",
      "dm": {
        "enabled": true,
        "allowFrom": ["*"]
      }
    }
  }
}
```

---

## 🎯 预期日志

启动成功后，应该在日志中看到：

```
[DingTalk Plugin] Registering DingTalk channel...
[DingTalk Plugin] DingTalk channel registered successfully!
[DingTalk] ================================================
[DingTalk] 正在启动钉钉 Stream 通道...
[DingTalk] ================================================
[DingTalk] AppKey: dingxxx
[DingTalk] AgentId: 4220221170
[DingTalk] Stream Endpoint: wss://connect-api.dingtalk.com/stream
[DingTalk] 群聊策略: open
[DingTalk] 私聊启用: 是
[DingTalk] ================================================
[DingTalk] ✅ 钉钉 Stream 通道启动成功！
[DingTalk] ================================================
```

---

## 🔧 调试命令

```bash
# 查看实时日志
journalctl -u clawdbot-gateway.service -f

# 或者直接运行（前台模式，可以看到所有输出）
systemctl stop clawdbot-gateway.service
clawdbot gateway run

# 手动测试插件加载
node --loader ts-node/esm -e "import('/usr/lib/node_modules/clawdbot/extensions/dingtalk/index.ts').then(m => console.log(m.default))"
```

---

## 🐛 如果还是不工作

1. **检查 Clawdbot 版本** - 确保你的 Clawdbot 支持扩展系统
   ```bash
   clawdbot --version
   ```

2. **检查其他扩展** - 看看 telegram/discord 是否正常工作
   ```bash
   ls -la /usr/lib/node_modules/clawdbot/extensions/telegram/
   cat /usr/lib/node_modules/clawdbot/extensions/telegram/index.ts
   ```

3. **查看 Clawdbot 加载逻辑**
   ```bash
   cat /usr/lib/node_modules/clawdbot/dist/plugins/load.js | grep -A 20 "loadExtensions"
   ```

---

## 📌 重要提醒

- ❌ **不要** 安装到 `~/.clawdbot/plugins/`
- ❌ **不要** 安装到 `~/.clawdbot/channels/`
- ✅ **必须** 安装到 `/usr/lib/node_modules/clawdbot/extensions/`
- ✅ **必须** 包含 `index.ts` 和 `clawdbot.plugin.json`
- ✅ **必须** 在 `package.json` 中指定 `"clawdbot": { "extensions": ["./index.ts"] }`

---

## 🎉 完成！

现在到服务器上运行安装脚本，然后检查日志！
