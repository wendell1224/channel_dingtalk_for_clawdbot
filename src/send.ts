/**
 * DingTalk Message Sending
 * 使用 sessionWebhook 和 axios 发送消息（推荐方式）
 */

import type { ClawdbotConfig } from "clawdbot/plugin-sdk";
import type { DingTalkConfig } from "./types.js";
import { resolveDingTalkCredentials } from "./accounts.js";

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
 * 通过 sessionWebhook 发送消息（最快，推荐）
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
 * 主要发送函数（使用 sessionWebhook）
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
    // 使用 sessionWebhook（DingTalk Stream 推荐方式）
    if (useWebhook) {
      const webhook = sessionWebhooks.get(to);
      if (webhook) {
        await sendViaWebhook(webhook, text);
        console.log(`[DingTalk] Sent message via webhook to ${to}`);
        return;
      } else {
        console.warn(`[DingTalk] No sessionWebhook found for ${to}`);
      }
    }

    // 如果没有 webhook，记录警告
    console.warn(`[DingTalk] Cannot send to ${to}: no sessionWebhook available`);
    console.warn(`[DingTalk] Message content: ${text.slice(0, 100)}...`);
  } catch (err) {
    throw new Error(`Failed to send DingTalk message: ${String(err)}`);
  }
}
