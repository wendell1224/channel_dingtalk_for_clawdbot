/**
 * 钉钉 Stream Channel 实现
 * 
 * 参考 Python 版本 (assistant_ding) 的完整逻辑:
 * - 使用钉钉 Stream SDK 建立长连接
 * - 接收实时消息事件
 * - 发送文本、Markdown、卡片消息
 * - 支持流式响应（通过 AICardReplier）
 */

import type { ChannelPlugin } from "clawdbot/plugin-sdk";
import { DingTalkStreamClient } from "./stream-client.js";
import { DingTalkMessageSender } from "./message-sender.js";
import type { DingTalkConfig, Gateway } from "./types.js";

/**
 * 钉钉 Stream 通道
 */
export class DingTalkStreamChannel implements ChannelPlugin {
  private client: DingTalkStreamClient | null = null;
  private sender: DingTalkMessageSender | null = null;
  private channelConfig: DingTalkConfig | null = null;
  private gateway: Gateway | null = null;

  /**
   * 元数据
   */
  meta = {
    label: "DingTalk",
    description: "钉钉 Stream 模式通道 - 无需公网IP的实时消息接收",
  };

  /**
   * 配置管理
   */
  config = {
    /**
     * 列出所有账户ID
     */
    listAccountIds: async (): Promise<string[]> => {
      // 钉钉 Stream 模式下，没有传统意义的多账户概念
      // 每个应用对应一个机器人实例
      return this.client ? ['default'] : [];
    },
  };

  /**
   * 引导配置
   */
  onboarding = {
    /**
     * 获取引导步骤
     */
    async getSteps() {
      return [
        {
          id: "credentials",
          title: "配置钉钉应用凭证",
          description: "从钉钉开放平台获取 AppKey、AppSecret 和 AgentId",
          fields: [
            {
              name: "appKey",
              label: "App Key",
              type: "text" as const,
              required: true,
              placeholder: "dingxxx...",
            },
            {
              name: "appSecret",
              label: "App Secret",
              type: "password" as const,
              required: true,
              placeholder: "应用密钥",
            },
            {
              name: "agentId",
              label: "Agent ID",
              type: "text" as const,
              required: true,
              placeholder: "应用的 AgentId",
            },
          ],
        },
        {
          id: "policies",
          title: "配置消息策略",
          description: "设置群聊和私聊的权限策略",
          fields: [
            {
              name: "groupPolicy",
              label: "群聊策略",
              type: "select" as const,
              required: true,
              options: [
                { value: "open", label: "开放模式 - 允许所有群" },
                { value: "allowlist", label: "白名单模式 - 仅允许指定群" },
              ],
              default: "open",
            },
            {
              name: "dmEnabled",
              label: "启用私聊",
              type: "boolean" as const,
              default: true,
            },
          ],
        },
      ];
    },
  };

  /**
   * 配对功能（用于连接账户）
   */
  pairing = {
    /**
     * 开始配对
     */
    async start() {
      return {
        instructions: "请在钉钉开放平台配置 Stream 模式，并填写应用凭证",
        authUrl: "https://open-dev.dingtalk.com",
      };
    },

    /**
     * 完成配对
     */
    async complete(data: any) {
      return {
        accountId: "default",
        accountName: "钉钉机器人",
      };
    },
  };

  /**
   * 通道能力
   */
  capabilities = {
    /**
     * 支持的消息类型
     */
    supportedMessageTypes: ["text", "markdown", "card"],

    /**
     * 支持群聊
     */
    supportsGroups: true,

    /**
     * 支持私聊
     */
    supportsDirectMessages: true,

    /**
     * 支持流式响应
     */
    supportsStreaming: false, // 钉钉的流式卡片需要特殊处理
  };

  /**
   * 启动通道
   */
  async start(config: DingTalkConfig, gateway: Gateway): Promise<void> {
    console.log('[DingTalk Channel] ================================================');
    console.log('[DingTalk Channel] 正在启动钉钉 Stream 通道...');
    console.log('[DingTalk Channel] ================================================');
    console.log(`[DingTalk Channel] AppKey: ${config.appKey}`);
    console.log(`[DingTalk Channel] AgentId: ${config.agentId}`);
    console.log(`[DingTalk Channel] Stream Endpoint: ${config.streamEndpoint || 'wss://connect-api.dingtalk.com/stream'}`);
    console.log(`[DingTalk Channel] 群聊策略: ${config.groupPolicy}`);
    console.log(`[DingTalk Channel] 私聊启用: ${config.dm?.enabled ? '是' : '否'}`);

    this.channelConfig = config;
    this.gateway = gateway;

    // 创建消息发送器
    this.sender = new DingTalkMessageSender(config);

    // 创建 Stream 客户端并连接
    this.client = new DingTalkStreamClient(config, gateway);
    await this.client.connect();

    console.log('[DingTalk Channel] ================================================');
    console.log('[DingTalk Channel] ✅ 钉钉 Stream 通道启动成功！');
    console.log('[DingTalk Channel] ================================================');
  }

  /**
   * 停止通道
   */
  async stop(): Promise<void> {
    console.log('[DingTalk Channel] ================================================');
    console.log('[DingTalk Channel] 正在停止钉钉 Stream 通道...');
    console.log('[DingTalk Channel] ================================================');

    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }

    this.sender = null;
    this.channelConfig = null;
    this.gateway = null;

    console.log('[DingTalk Channel] ================================================');
    console.log('[DingTalk Channel] ✅ 钉钉 Stream 通道已停止');
    console.log('[DingTalk Channel] ================================================');
  }

  /**
   * 发送消息（简化接口，向后兼容）
   */
  async sendMessage(chatId: string, text: string, isGroup: boolean): Promise<void> {
    if (!this.sender) {
      throw new Error('DingTalk 通道未启动');
    }
    await this.sender.sendText(chatId, text, isGroup);
  }

  /**
   * 获取连接统计信息
   */
  getStats(): any {
    if (!this.client) {
      return { status: 'disconnected' };
    }
    return this.client.getStats();
  }
}
