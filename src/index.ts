/**
 * Clawdbot 钉钉 Stream 通道插件
 *
 * 通过钉钉 Stream 模式实现长连接，无需公网 IP 即可接收实时消息
 *
 * @packageDocumentation
 */

import { DingTalkStreamClient } from './stream-client';
import { DingTalkMessageSender } from './message-sender';
import { DingTalkConfig, Gateway, DingTalkChannel, SendMessageOptions } from './types';

/**
 * 通道实例
 */
let client: DingTalkStreamClient | null = null;
let sender: DingTalkMessageSender | null = null;

/**
 * 钉钉 Stream 通道
 */
export const dingtalk: DingTalkChannel = {
  id: 'dingtalk',
  name: 'DingTalk (Stream Mode)',
  label: 'DingTalk',

  /**
   * 启动通道
   */
  async start(config: DingTalkConfig, gateway: Gateway): Promise<void> {
    console.log('[DingTalk] ================================================');
    console.log('[DingTalk] 正在启动钉钉 Stream 通道...');
    console.log('[DingTalk] ================================================');
    console.log(`[DingTalk] AppKey: ${config.appKey}`);
    console.log(`[DingTalk] AgentId: ${config.agentId}`);
    console.log(`[DingTalk] Stream Endpoint: ${config.streamEndpoint || 'wss://connect-api.dingtalk.com/stream'}`);
    console.log(`[DingTalk] 群聊策略: ${config.groupPolicy}`);
    console.log(`[DingTalk] 私聊启用: ${config.dm?.enabled ? '是' : '否'}`);

    // 创建消息发送器
    sender = new DingTalkMessageSender(config);

    // 创建 Stream 客户端并连接
    client = new DingTalkStreamClient(config, gateway);
    await client.connect();

    console.log('[DingTalk] ================================================');
    console.log('[DingTalk] ✅ 钉钉 Stream 通道启动成功！');
    console.log('[DingTalk] ================================================');
  },

  /**
   * 停止通道
   */
  async stop(): Promise<void> {
    console.log('[DingTalk] ================================================');
    console.log('[DingTalk] 正在停止钉钉 Stream 通道...');
    console.log('[DingTalk] ================================================');

    if (client) {
      await client.disconnect();
      client = null;
    }
    sender = null;

    console.log('[DingTalk] ================================================');
    console.log('[DingTalk] ✅ 钉钉 Stream 通道已停止');
    console.log('[DingTalk] ================================================');
  },

  /**
   * 发送消息（简化接口，向后兼容）
   */
  async sendMessage(chatId: string, text: string, isGroup: boolean): Promise<void> {
    if (!sender) {
      throw new Error('DingTalk 通道未启动');
    }
    await sender.sendText(chatId, text, isGroup);
  },

  /**
   * 发送消息（完整接口）
   */
  async sendMessageWithOptions(chatId: string, text: string, options: SendMessageOptions): Promise<void> {
    if (!sender) {
      throw new Error('DingTalk 通道未启动');
    }
    await sender.sendMessage(chatId, text, options);
  },

  /**
   * 发送 Markdown 消息
   */
  async sendMarkdown(chatId: string, title: string, text: string, isGroup: boolean): Promise<void> {
    if (!sender) {
      throw new Error('DingTalk 通道未启动');
    }
    await sender.sendMarkdown(chatId, title, text, isGroup);
  },

  /**
   * 发送卡片消息
   */
  async sendCard(chatId: string, cardContent: any, isGroup: boolean): Promise<void> {
    if (!sender) {
      throw new Error('DingTalk 通道未启动');
    }
    await sender.sendCard(chatId, cardContent, isGroup);
  },

  /**
   * 获取连接统计信息
   */
  getStats(): any {
    if (!client) {
      return { status: 'disconnected' };
    }
    return client.getStats();
  }
};

// 默认导出
export default dingtalk;

// 导出类型
export * from './types';
export * from './utils';
