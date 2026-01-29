/**
 * DingTalk Message Sending
 * 支持通过 sessionWebhook 和 DingTalk API 发送消息
 */

import type { ClawdbotConfig } from "clawdbot/plugin-sdk";
import type { DingTalkConfig } from "./types.js";
import { resolveDingTalkCredentials } from "./accounts.js";
import * as dingtalk from "@alicloud/dingtalk";

// 全局存储 sessionWebhook 映射 (chatId -> webhook URL)
const sessionWebhooks = new Map<string, string>();

/**
 * 存储会话 webhook（从接收到的消息中提取）
 */
export function storeSessionWebhook(chatId: string, webhook: string): void {
  if (webhook) {
    sessionWebhooks.set(chatId, webhook);
  }
}

/**
 * 获取访问令牌（缓存）
 */
let cachedToken: { token: string; expireAt: number } | null = null;

async function getAccessToken(appKey: string, appSecret: string): Promise<string> {
  const now = Date.now();
  
  // 如果缓存有效，直接返回
  if (cachedToken && cachedToken.expireAt > now + 60000) {
    return cachedToken.token;
  }

  try {
    const client = new dingtalk.default({
      protocol: "https",
      regionId: "central",
    });
    
    const authRequest = new dingtalk.oauth2_1_0.GetAccessTokenRequest({
      appKey,
      appSecret,
    });
    
    const response = await client.getAccessToken(authRequest);
    const token = response.body?.accessToken;
    const expiresIn = response.body?.expireIn || 7200;
    
    if (!token) {
      throw new Error("Failed to get access token");
    }
    
    // 缓存 token（提前 5 分钟过期）
    cachedToken = {
      token,
      expireAt: now + (expiresIn - 300) * 1000,
    };
    
    return token;
  } catch (err) {
    throw new Error(`Failed to get DingTalk access token: ${String(err)}`);
  }
}

/**
 * 通过 sessionWebhook 发送消息（最快，推荐用于回复）
 */
async function sendViaWebhook(webhook: string, content: string): Promise<void> {
  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msgtype: "text",
      text: {
        content,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Webhook request failed: ${response.status} ${text}`);
  }
}

/**
 * 通过 DingTalk API 发送单聊消息
 */
async function sendP2PMessage(
  accessToken: string,
  userId: string,
  content: string
): Promise<void> {
  const client = new dingtalk.default({
    protocol: "https",
    regionId: "central",
  });
  
  const sendRequest = new dingtalk.im_1_0.SendRobotMessageRequest({
    robotCode: accessToken, // 注意：这里可能需要 robotCode，请根据实际情况调整
    userId,
    msgKey: "sampleText",
    msgParam: JSON.stringify({
      content,
    }),
  });
  
  await client.sendRobotMessage(sendRequest);
}

/**
 * 通过 DingTalk API 发送群聊消息
 */
async function sendGroupMessage(
  accessToken: string,
  chatId: string,
  content: string
): Promise<void> {
  const client = new dingtalk.default({
    protocol: "https",
    regionId: "central",
  });
  
  const sendRequest = new dingtalk.im_1_0.SendRobotMessageRequest({
    robotCode: accessToken, // 注意：这里可能需要调整
    openConversationId: chatId,
    msgKey: "sampleText",
    msgParam: JSON.stringify({
      content,
    }),
  });
  
  await client.sendRobotMessage(sendRequest);
}

/**
 * 主要发送函数（自动选择最优方式）
 */
export async function sendMessageDingTalk(params: {
  cfg: ClawdbotConfig;
  to: string; // chatId 或 userId
  text: string;
  useWebhook?: boolean; // 优先使用 webhook
}): Promise<void> {
  const { cfg, to, text, useWebhook = true } = params;
  const dingtalkCfg = cfg.channels?.dingtalk as DingTalkConfig | undefined;
  const creds = resolveDingTalkCredentials(dingtalkCfg);
  
  if (!creds) {
    throw new Error("DingTalk credentials not configured");
  }

  try {
    // 方式 1: 优先使用 sessionWebhook（最快，最可靠）
    if (useWebhook) {
      const webhook = sessionWebhooks.get(to);
      if (webhook) {
        await sendViaWebhook(webhook, text);
        console.log(`[DingTalk] Sent message via webhook to ${to}`);
        return;
      }
    }

    // 方式 2: 使用 DingTalk API
    const accessToken = await getAccessToken(creds.appKey, creds.appSecret);
    
    // 判断是单聊还是群聊（简单判断：群聊 ID 通常较长）
    if (to.startsWith("cid") || to.length > 20) {
      await sendGroupMessage(accessToken, to, text);
      console.log(`[DingTalk] Sent group message via API to ${to}`);
    } else {
      await sendP2PMessage(accessToken, to, text);
      console.log(`[DingTalk] Sent P2P message via API to ${to}`);
    }
  } catch (err) {
    throw new Error(`Failed to send DingTalk message: ${String(err)}`);
  }
}
