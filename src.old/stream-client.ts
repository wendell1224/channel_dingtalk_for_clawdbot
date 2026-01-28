/**
 * 钉钉 Stream 连接客户端
 *
 * 负责与钉钉 Stream 服务器建立长连接，接收实时事件
 */

import WebSocket from 'ws';
import { DingTalkConfig, Gateway, DingTalkEvent, ConnectionStatus, ConnectionStats } from './types';
import { sleep, safeJsonParse } from './utils';
import oauth2Client, * as oauth2 from '@alicloud/dingtalk/dist/oauth2_1_0/client';
import * as $OpenApi from '@alicloud/openapi-client';

/**
 * 钉钉 Stream 客户端
 */
export class DingTalkStreamClient {
  private config: DingTalkConfig;
  private gateway: Gateway;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private accessToken: string | null = null;
  private logger: any;
  private isStopping = false;
  private stats: ConnectionStats = {
    status: ConnectionStatus.Disconnected,
    reconnectCount: 0,
    messagesReceived: 0,
    messagesSent: 0
  };

  constructor(config: DingTalkConfig, gateway: Gateway) {
    this.config = config;
    this.gateway = gateway;
    this.logger = gateway.getLogger();
  }

  /**
   * 获取连接统计信息
   */
  getStats(): ConnectionStats {
    return { ...this.stats };
  }

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      const client = new oauth2Client(new $OpenApi.Config({}));

      const request = new oauth2.GetAccessTokenRequest({
        appKey: this.config.appKey,
        appSecret: this.config.appSecret,
      });

      const response = await client.getAccessToken(request);

      this.accessToken = response.body?.accessToken || '';
      
      if (!this.accessToken) {
        throw new Error('获取访问令牌失败：返回值为空');
      }

      this.logger.info('[DingTalk] 获取访问令牌成功');
      return this.accessToken;
    } catch (error: any) {
      this.logger.error('[DingTalk] 获取访问令牌失败:', error);
      this.stats.status = ConnectionStatus.Error;
      this.stats.lastError = error?.message || '获取访问令牌失败';
      throw error;
    }
  }

  /**
   * 刷新访问令牌
   */
  private async refreshAccessToken(): Promise<void> {
    this.accessToken = null;
    await this.getAccessToken();
  }

  /**
   * 连接到钉钉 Stream 服务器
   */
  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.logger.warn('[DingTalk] 已经连接，跳过重复连接');
      return;
    }

    this.isStopping = false;
    this.stats.status = ConnectionStatus.Connecting;

    const endpoint = this.config.streamEndpoint || 'wss://connect-api.dingtalk.com/stream';

    try {
      const token = await this.getAccessToken();

      this.logger.info(`[DingTalk] 正在连接到 Stream 服务器: ${endpoint}`);

      this.ws = new WebSocket(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-acs-dingtalk-access-token': token,
        },
      });

      this.setupWebSocketHandlers();

    } catch (error: any) {
      this.logger.error('[DingTalk] 连接失败:', error);
      this.stats.status = ConnectionStatus.Error;
      this.stats.lastError = error?.message || '连接失败';

      if (!this.isStopping) {
        this.scheduleReconnect();
      }
      throw error;
    }
  }

  /**
   * 设置 WebSocket 事件处理器
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.on('open', () => {
      this.stats.status = ConnectionStatus.Connected;
      this.stats.connectedAt = new Date();
      this.stats.reconnectCount = 0;

      this.logger.info('[DingTalk] Stream 连接建立成功');
      this.scheduleHeartbeat();
    });

    this.ws.on('message', async (data: WebSocket.Data) => {
      await this.handleMessage(data);
    });

    this.ws.on('error', (error) => {
      this.logger.error('[DingTalk] WebSocket 错误:', error);
      this.stats.status = ConnectionStatus.Error;
      this.stats.lastError = error?.message || 'WebSocket 错误';
    });

    this.ws.on('close', (code, reason) => {
      this.logger.warn(`[DingTalk] Stream 连接关闭: code=${code}, reason=${reason}`);
      this.stats.status = ConnectionStatus.Disconnected;
      this.stats.connectedAt = undefined;

      this.cleanup();

      if (!this.isStopping) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('pong', () => {
      this.logger.debug('[DingTalk] 收到 Pong 响应');
    });
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(data: WebSocket.Data): Promise<void> {
    try {
      const text = data.toString();
      const event = safeJsonParse<DingTalkEvent>(text);

      if (!event) {
        this.logger.warn('[DingTalk] 无法解析消息:', text);
        return;
      }

      this.stats.messagesReceived++;
      this.logger.info(`[DingTalk] 收到事件: ${event.eventType}`);

      // 只处理聊天消息
      if (event.eventType === 'chat' || event.msgtype) {
        await this.dispatchToGateway(event);
      }

    } catch (error: any) {
      this.logger.error('[DingTalk] 处理消息失败:', error);
    }
  }

  /**
   * 转发事件到 Gateway
   */
  private async dispatchToGateway(event: DingTalkEvent): Promise<void> {
    // 检查权限
    if (!this.checkPermission(event)) {
      this.logger.warn('[DingTalk] 权限检查失败，拒绝处理');
      return;
    }

    try {
      const gatewayEvent = {
        channel: 'dingtalk',
        type: 'message',
        from: {
          id: event.senderId,
          name: event.senderNick,
        },
        chat: {
          id: event.conversationId,
          type: event.conversationType === '1' ? 'dm' : 'group',
        },
        content: {
          text: this.extractTextContent(event),
          raw: event,
        },
        timestamp: new Date(event.createAt),
      };

      await this.gateway.dispatch(gatewayEvent);
    } catch (error: any) {
      this.logger.error('[DingTalk] 转发到 Gateway 失败:', error);
    }
  }

  /**
   * 检查权限
   */
  private checkPermission(event: DingTalkEvent): boolean {
    // 单聊检查
    if (event.conversationType === '1') {
      if (!this.config.dm?.enabled) {
        return false;
      }
      if (!this.config.dm.allowFrom.includes(event.senderId)) {
        this.logger.warn(`[DingTalk] 用户 ${event.senderId} 不在私聊允许列表中`);
        return false;
      }
    }

    // 群聊检查
    if (event.conversationType === '2') {
      if (this.config.groupPolicy === 'allowlist') {
        if (!this.config.groupAllowFrom?.includes(event.conversationId)) {
          this.logger.warn(`[DingTalk] 群 ${event.conversationId} 不在允许列表中`);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 提取文本内容
   */
  private extractTextContent(event: DingTalkEvent): string {
    if (event.msgtype === 'text') {
      return event.content?.content || '';
    }
    if (event.msgtype === 'markdown') {
      return event.content?.text || '';
    }
    return `[${event.msgtype}]`;
  }

  /**
   * 心跳保活
   */
  private scheduleHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000;

    this.cleanupHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        this.logger.debug('[DingTalk] 发送心跳');
      }
    }, interval);
  }

  /**
   * 清理心跳定时器
   */
  private cleanupHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 计划重连
   */
  private scheduleReconnect(): void {
    this.cleanupReconnect();

    const delay = this.config.reconnectInterval || 5000;

    this.stats.reconnectCount++;
    this.logger.info(`[DingTalk] 将在 ${delay / 1000} 秒后重连... (第 ${this.stats.reconnectCount} 次)`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // 连接失败会在 connect() 方法中再次触发重连
      }
    }, delay);
  }

  /**
   * 清理重连定时器
   */
  private cleanupReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.cleanupHeartbeat();
    this.cleanupReconnect();
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    this.isStopping = true;
    this.stats.status = ConnectionStatus.Disconnecting;

    this.logger.info('[DingTalk] 正在断开连接...');

    this.cleanup();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.stats.status = ConnectionStatus.Disconnected;
    this.stats.connectedAt = undefined;

    this.logger.info('[DingTalk] 已断开连接');
  }
}
