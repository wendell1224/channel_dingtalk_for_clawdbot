# 快速修复指南

## 问题：`unknown channel id: dingtalk`

这个错误表示 Clawdbot 无法识别 dingtalk 插件。原因是插件没有正确安装。

## 解决方案

在你的服务器上执行以下命令：

### 步骤 1：重新安装插件

```bash
# 进入项目目录
cd /tmp/channel_dingtalk_for_clawdbot

# 确保已经编译
npm install
npm run build

# 删除旧的安装
rm -rf ~/.clawdbot/channels/dingtalk

# 创建插件目录
mkdir -p ~/.clawdbot/channels/dingtalk

# 复制所有必要文件（重要！必须包含 package.json）
cp -r dist ~/.clawdbot/channels/dingtalk/
cp package.json ~/.clawdbot/channels/dingtalk/
cp -r node_modules ~/.clawdbot/channels/dingtalk/
```

### 步骤 2：验证安装

```bash
# 检查文件是否存在
ls -la ~/.clawdbot/channels/dingtalk/

# 应该看到：
# - dist/
# - node_modules/
# - package.json
```

### 步骤 3：检查 package.json 中的插件元数据

```bash
cat ~/.clawdbot/channels/dingtalk/package.json | grep -A 3 '"clawdbot"'

# 应该输出：
#   "clawdbot": {
#     "type": "channel",
#     "id": "dingtalk"
#   },
```

### 步骤 4：重启 Clawdbot

```bash
clawdbot gateway restart
```

## 另一种方法：使用软链接（推荐用于开发）

如果你想要方便地更新插件，可以使用软链接：

```bash
# 确保项目已编译
cd /tmp/channel_dingtalk_for_clawdbot
npm install
npm run build

# 删除旧的安装
rm -rf ~/.clawdbot/channels/dingtalk

# 创建软链接
ln -s /tmp/channel_dingtalk_for_clawdbot ~/.clawdbot/channels/dingtalk

# 重启
clawdbot gateway restart
```

## 验证插件是否加载成功

```bash
# 查看 Clawdbot 日志
journalctl -u clawdbot-gateway.service -f

# 或者直接查看日志文件
tail -f ~/.clawdbot/gateway.log
```

成功加载后，你应该在日志中看到类似这样的信息：
```
[DingTalk] 正在启动钉钉 Stream 通道...
[DingTalk] ✅ 钉钉 Stream 通道启动成功！
```

## 常见问题

### Q: 还是报 `unknown channel id: dingtalk`？

A: 确保：
1. `~/.clawdbot/channels/dingtalk/package.json` 存在
2. package.json 中包含 `"clawdbot"` 配置块
3. 重启后等待几秒钟让 Clawdbot 重新扫描插件

### Q: 报找不到模块错误？

A: 确保 `node_modules` 目录已经复制，或者在插件目录中运行 `npm install`：
```bash
cd ~/.clawdbot/channels/dingtalk
npm install
```

### Q: 想要查看插件是否被 Clawdbot 识别？

A: 运行：
```bash
clawdbot doctor
```

应该能看到 dingtalk 通道的相关信息。
