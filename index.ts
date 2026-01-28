/**
 * Clawdbot 钉钉 Stream 插件入口
 * 
 * 参考 Python 版本的完整实现，使用钉钉 Stream SDK 接收消息
 * 并通过 Clawdbot 的 Channel Plugin API 注册
 */

import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";
import { emptyPluginConfigSchema } from "clawdbot/plugin-sdk";
import { DingTalkStreamChannel } from "./src/channel.js";

/**
 * 插件定义
 */
const plugin = {
  id: "dingtalk-stream",
  name: "DingTalk Stream",
  description: "钉钉 Stream 模式通道插件 - 无需公网IP，通过长连接实时接收消息",
  configSchema: emptyPluginConfigSchema(),
  
  /**
   * 注册插件
   */
  register(api: ClawdbotPluginApi) {
    console.log('[DingTalk Plugin] Registering DingTalk Stream channel...');
    
    // 创建通道实例
    const channel = new DingTalkStreamChannel();
    
    // 注册到 Clawdbot
    api.registerChannel({
      name: 'dingtalk',
      label: 'DingTalk',
      plugin: channel
    });
    
    console.log('[DingTalk Plugin] DingTalk Stream channel registered successfully!');
  },
};

export default plugin;
