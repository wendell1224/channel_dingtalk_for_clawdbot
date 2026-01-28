/**
 * 钉钉 Stream 通道类型定义
 *
 * @packageDocumentation
 */

/**
 * 钉钉 Stream 事件类型
 */
export interface DingTalkEvent {
  /** 事件类型 */
  eventType: string;
  /** 消息 ID */
  msgId: string;
  /** 会话 ID */
  conversationId: string;
  /** 会话类型：1=单聊, 2=群聊 */
  conversationType: string;
  /** 发送者 ID */
  senderId: string;
  /** 发送者昵称 */
  senderNick: string;
  /** 员工 ID */
  staffId: string;
  /** 机器人用户 ID */
  chatbotUserId: string;
  /** 消息类型 */
  msgtype: string;
  /** 消息内容 */
  content: any;
  /** 创建时间 */
  createAt: number;
  /** 消息来源 */
  msgSource?: string;
}

/**
 * 钉钉文本消息内容
 */
export interface TextMessageContent {
  /** 文本内容 */
  content: string;
}

/**
 * 钉钉 Markdown 消息内容
 */
export interface MarkdownMessageContent {
  /** 标题 */
  title: string;
  /** Markdown 文本 */
  text: string;
}

/**
 * Clawdbot 通道配置
 */
export interface DingTalkConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 钉钉 AppKey */
  appKey: string;
  /** 钉钉 AppSecret */
  appSecret: string;
  /** 钉钉应用 AgentId */
  agentId: string;
  /** Stream 接入地址（可选，默认使用官方地址） */
  streamEndpoint?: string;
  /** 群聊策略 */
  groupPolicy: 'allowlist' | 'open';
  /** 允许的群 ID 列表 */
  groupAllowFrom?: string[];
  /** 私聊配置 */
  dm?: {
    /** 是否启用私聊 */
    enabled: boolean;
    /** 允许私聊的用户 ID 列表 */
    allowFrom: string[];
  };
  /** 心跳间隔（毫秒） */
  heartbeatInterval?: number;
  /** 重连间隔（毫秒） */
  reconnectInterval?: number;
}

/**
 * Gateway 接口
 */
export interface Gateway {
  /** 分发事件到 Agent */
  dispatch(event: any): Promise<void>;
  /** 获取工作区目录 */
  getWorkspaceDir(): string;
  /** 获取日志记录器 */
  getLogger(): any;
  /** 获取配置 */
  getConfig(): any;
}

/**
 * 通道启动选项
 */
export interface ChannelStartOptions {
  /** 通道配置 */
  config: DingTalkConfig;
  /** Gateway 实例 */
  gateway: Gateway;
}

/**
 * 消息发送选项
 */
export interface SendMessageOptions {
  /** 是否为群聊 */
  isGroup: boolean;
  /** 消息类型 */
  msgType?: 'text' | 'markdown' | 'interactive';
  /** Markdown 选项（当 msgType=markdown 时） */
  markdown?: {
    title: string;
    text: string;
  };
  /** 卡片内容（当 msgType=interactive 时） */
  card?: any;
}

/**
 * 连接状态
 */
export enum ConnectionStatus {
  /** 未连接 */
  Disconnected = 'disconnected',
  /** 连接中 */
  Connecting = 'connecting',
  /** 已连接 */
  Connected = 'connected',
  /** 断线中 */
  Disconnecting = 'disconnecting',
  /** 错误 */
  Error = 'error'
}

/**
 * 连接统计信息
 */
export interface ConnectionStats {
  /** 状态 */
  status: ConnectionStatus;
  /** 连接时间 */
  connectedAt?: Date;
  /** 最后一次错误 */
  lastError?: string;
  /** 重连次数 */
  reconnectCount: number;
  /** 收到的消息数 */
  messagesReceived: number;
  /** 发送的消息数 */
  messagesSent: number;
}

/**
 * 钉钉通道接口
 */
export interface DingTalkChannel {
  /** 通道 ID */
  id: string;
  /** 通道名称 */
  name: string;
  /** 启动通道 */
  start(config: DingTalkConfig, gateway: Gateway): Promise<void>;
  /** 停止通道 */
  stop(): Promise<void>;
  /** 发送消息（简化接口） */
  sendMessage(chatId: string, text: string, isGroup: boolean): Promise<void>;
  /** 发送消息（完整接口） */
  sendMessageWithOptions(chatId: string, text: string, options: SendMessageOptions): Promise<void>;
  /** 发送 Markdown 消息 */
  sendMarkdown(chatId: string, title: string, text: string, isGroup: boolean): Promise<void>;
  /** 发送卡片消息 */
  sendCard(chatId: string, cardContent: any, isGroup: boolean): Promise<void>;
  /** 获取连接统计信息 */
  getStats(): ConnectionStats;
}
