/**
 * 钉钉消息发送器
 *
 * 负责通过钉钉 API 发送各种类型的消息
 */

import { DingTalkConfig, SendMessageOptions, TextMessageContent, MarkdownMessageContent } from './types';
import oauth2Client, * as oauth2 from '@alicloud/dingtalk/dist/oauth2_1_0/client';
import imClient, * as im from '@alicloud/dingtalk/dist/im_1_0/client';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';

/**
 * 钉钉消息发送器
 */
export class DingTalkMessageSender {
  private config: DingTalkConfig;
  private accessToken: string | null = null;
  private messageQueue: Map<string, number> = new Map();
  private RATE_LIMIT = 1000; // 1 秒内最多发送 1 条消息

  constructor(config: DingTalkConfig) {
    this.config = config;
  }

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const client = new oauth2Client(new $OpenApi.Config({}));

    try {
      const request = new oauth2.GetAccessTokenRequest({
        appKey: this.config.appKey,
        appSecret: this.config.appSecret,
      });

      const response = await client.getAccessToken(request);

      this.accessToken = response.body?.accessToken || '';
      
      if (!this.accessToken) {
        throw new Error('获取访问令牌失败：返回值为空');
      }

      return this.accessToken;
    } catch (error: any) {
      throw new Error(`获取访问令牌失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 检查频率限制
   */
  private async checkRateLimit(chatId: string): Promise<boolean> {
    const lastSent = this.messageQueue.get(chatId);
    if (lastSent && Date.now() - lastSent < this.RATE_LIMIT) {
      return false;
    }
    this.messageQueue.set(chatId, Date.now());
    return true;
  }

  /**
   * 发送文本消息
   */
  async sendText(chatId: string, text: string, isGroup: boolean): Promise<void> {
    // 检查频率限制
    if (!(await this.checkRateLimit(chatId))) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT));
    }

    const accessToken = await this.getAccessToken();
    const client = new imClient(new $OpenApi.Config({}));

    const message = JSON.stringify({
      msgtype: 'text',
      text: { content: text }
    });

    const headers = new im.SendMessageHeaders({
      xAcsDingtalkAccessToken: accessToken,
    });

    const runtime = new $Util.RuntimeOptions({});

    try {
      if (isGroup) {
        // 发送到群聊
        const request = new im.SendMessageRequest({
          message,
        });
        await client.sendMessageWithOptions(request, headers, runtime);
      } else {
        // 发送到单聊
        const request = new im.SendDingMessageRequest({
          message,
        });
        await client.sendDingMessageWithOptions(request, headers, runtime);
      }
    } catch (error: any) {
      throw new Error(`发送文本消息失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 发送 Markdown 消息
   */
  async sendMarkdown(chatId: string, title: string, text: string, isGroup: boolean): Promise<void> {
    // 检查频率限制
    if (!(await this.checkRateLimit(chatId))) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT));
    }

    const accessToken = await this.getAccessToken();
    const client = new imClient(new $OpenApi.Config({}));

    const message = JSON.stringify({
      msgtype: 'markdown',
      markdown: { title, text }
    });

    const headers = new im.SendMessageHeaders({
      xAcsDingtalkAccessToken: accessToken,
    });

    const runtime = new $Util.RuntimeOptions({});

    try {
      if (isGroup) {
        const request = new im.SendMessageRequest({
          message,
        });
        await client.sendMessageWithOptions(request, headers, runtime);
      } else {
        const request = new im.SendDingMessageRequest({
          message,
        });
        await client.sendDingMessageWithOptions(request, headers, runtime);
      }
    } catch (error: any) {
      throw new Error(`发送 Markdown 消息失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 发送卡片消息
   */
  async sendCard(chatId: string, cardContent: any, isGroup: boolean): Promise<void> {
    // 检查频率限制
    if (!(await this.checkRateLimit(chatId))) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT));
    }

    const accessToken = await this.getAccessToken();
    const client = new imClient(new $OpenApi.Config({}));

    const message = JSON.stringify({
      msgtype: 'interactive',
      interactive: cardContent
    });

    const headers = new im.SendMessageHeaders({
      xAcsDingtalkAccessToken: accessToken,
    });

    const runtime = new $Util.RuntimeOptions({});

    try {
      if (isGroup) {
        const request = new im.SendMessageRequest({
          message,
        });
        await client.sendMessageWithOptions(request, headers, runtime);
      } else {
        const request = new im.SendDingMessageRequest({
          message,
        });
        await client.sendDingMessageWithOptions(request, headers, runtime);
      }
    } catch (error: any) {
      throw new Error(`发送卡片消息失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 统一发送消息接口
   */
  async sendMessage(chatId: string, text: string, options: SendMessageOptions): Promise<void> {
    const { isGroup, msgType = 'text', markdown, card } = options;

    switch (msgType) {
      case 'text':
        await this.sendText(chatId, text, isGroup);
        break;
      case 'markdown':
        if (!markdown) {
          throw new Error('Markdown 消息需要提供 markdown 选项');
        }
        await this.sendMarkdown(chatId, markdown.title, markdown.text, isGroup);
        break;
      case 'interactive':
        if (!card) {
          throw new Error('卡片消息需要提供 card 选项');
        }
        await this.sendCard(chatId, card, isGroup);
        break;
      default:
        throw new Error(`不支持的消息类型: ${msgType}`);
    }
  }
}
