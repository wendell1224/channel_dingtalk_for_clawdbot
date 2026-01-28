/**
 * Clawdbot Plugin SDK 类型声明
 * 
 * 这些类型定义基于 Clawdbot 的实际实现
 * 参考了 telegram 和 discord 插件的接口定义
 */

declare module "clawdbot/plugin-sdk" {
  /**
   * 插件 API
   */
  export interface ClawdbotPluginApi {
    registerChannel(options: RegisterChannelOptions): void;
  }

  /**
   * 注册通道选项
   */
  export interface RegisterChannelOptions {
    name: string;
    label: string;
    plugin: ChannelPlugin;
  }

  /**
   * 通道插件接口
   */
  export interface ChannelPlugin {
    /**
     * 元数据
     */
    meta: {
      label: string;
      description?: string;
    };

    /**
     * 配置管理
     */
    config: {
      listAccountIds(): Promise<string[]>;
    };

    /**
     * 引导配置
     */
    onboarding: {
      getSteps(): Promise<OnboardingStep[]>;
    };

    /**
     * 配对功能
     */
    pairing: {
      start(): Promise<PairingStartResult>;
      complete(data: any): Promise<PairingCompleteResult>;
    };

    /**
     * 通道能力
     */
    capabilities: {
      supportedMessageTypes: string[];
      supportsGroups: boolean;
      supportsDirectMessages: boolean;
      supportsStreaming: boolean;
    };

    /**
     * 启动通道
     */
    start(config: any, gateway: any): Promise<void>;

    /**
     * 停止通道
     */
    stop(): Promise<void>;

    /**
     * 发送消息
     */
    sendMessage(chatId: string, text: string, isGroup: boolean): Promise<void>;

    /**
     * 获取统计信息
     */
    getStats?(): any;
  }

  /**
   * 引导步骤
   */
  export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    fields: OnboardingField[];
  }

  /**
   * 引导字段
   */
  export interface OnboardingField {
    name: string;
    label: string;
    type: "text" | "password" | "select" | "boolean";
    required?: boolean;
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    default?: any;
  }

  /**
   * 配对开始结果
   */
  export interface PairingStartResult {
    instructions: string;
    authUrl?: string;
  }

  /**
   * 配对完成结果
   */
  export interface PairingCompleteResult {
    accountId: string;
    accountName: string;
  }

  /**
   * 空插件配置 Schema
   */
  export function emptyPluginConfigSchema(): object;
}
