/**
 * DingTalk Message Sending
 * 使用官方 SDK 和 sessionWebhook 发送消息
 */

import type { ClawdbotConfig } from "clawdbot/plugin-sdk";
import type { DingTalkConfig } from "./types.js";
import { resolveDingTalkCredentials } from "./accounts.js";
import { getDingTalkRuntime } from "./runtime.js";
import axios from "axios";

// 缓存 access token（有效期 2 小时）
let cachedAccessToken: string | null = null;
let tokenExpireTime = 0;

/**
 * 获取 DingTalk Access Token
 */
async function getAccessToken(appKey: string, appSecret: string): Promise<string> {
  const now = Date.now();
  
  // 如果缓存的 token 还没过期，直接返回
  if (cachedAccessToken && now < tokenExpireTime - 5 * 60 * 1000) {
    return cachedAccessToken;
  }

  try {
    const response = await axios.get(
      "https://oapi.dingtalk.com/gettoken",
      {
        params: {
          appkey: appKey,
          appsecret: appSecret,
        },
      }
    );

    if (response.data.errcode === 0) {
      cachedAccessToken = response.data.access_token;
      // 设置过期时间（2小时，提前5分钟刷新）
      tokenExpireTime = now + 2 * 60 * 60 * 1000;
      return cachedAccessToken;
    } else {
      throw new Error(`Failed to get access token: ${response.data.errmsg}`);
    }
  } catch (err) {
    throw new Error(`Failed to get DingTalk access token: ${String(err)}`);
  }
}

/**
 * 通过 sessionWebhook 发送消息（群聊和单聊通用）
 */
export async function sendMessageViaWebhook(params: {
  sessionWebhook: string;
  accessToken: string;
  content: string;
  msgtype?: "text" | "markdown";
  atUserIds?: string[];
  atAll?: boolean;
}): Promise<void> {
  const { sessionWebhook, accessToken, content, msgtype = "text", atUserIds = [], atAll = false } = params;

  const body: any = {
    msgtype,
  };

  if (msgtype === "text") {
    body.text = { content };
    body.at = {
      atUserIds,
      isAtAll: atAll,
    };
  } else if (msgtype === "markdown") {
    body.markdown = {
      title: "回复",
      text: content,
    };
    body.at = {
      atUserIds,
      isAtAll: atAll,
    };
  }

  try {
    const response = await axios.post(sessionWebhook, body, {
      headers: {
        "Content-Type": "application/json",
        "x-acs-dingtalk-access-token": accessToken,
      },
    });

    if (response.data?.errcode && response.data.errcode !== 0) {
      throw new Error(`DingTalk API error: ${response.data.errmsg}`);
    }
  } catch (err) {
    throw new Error(`Failed to send message via webhook: ${String(err)}`);
  }
}

/**
 * 发送文本消息
 */
export async function sendMessageDingTalk(params: {
  cfg: ClawdbotConfig;
  to: string;
  text: string;
  sessionWebhook?: string;
  atUserIds?: string[];
}): Promise<void> {
  const { cfg, to, text, sessionWebhook, atUserIds = [] } = params;
  const dingtalkCfg = cfg.channels?.dingtalk as DingTalkConfig | undefined;
  const creds = resolveDingTalkCredentials(dingtalkCfg);
  
  if (!creds) {
    throw new Error("DingTalk credentials not configured");
  }

  const runtime = getDingTalkRuntime();
  const log = runtime.log ?? console.log;
  const error = runtime.error ?? console.error;

  try {
    log(`dingtalk: sending message to ${to}: ${text.slice(0, 100)}...`);

    // 获取 access token
    const accessToken = await getAccessToken(creds.appKey, creds.appSecret);

    if (sessionWebhook) {
      // 如果有 sessionWebhook，直接使用（群聊和单聊回复）
      await sendMessageViaWebhook({
        sessionWebhook,
        accessToken,
        content: text,
        msgtype: "text",
        atUserIds,
      });
      log(`dingtalk: message sent successfully via webhook`);
    } else {
      // 否则使用 API 发送（需要根据 to 的格式判断是群聊还是单聊）
      // TODO: 实现 API 发送方式
      log(`dingtalk: API sending not yet implemented, need sessionWebhook`);
      throw new Error("sessionWebhook is required for sending messages");
    }
  } catch (err) {
    error(`dingtalk: failed to send message: ${String(err)}`);
    throw err;
  }
}

/**
 * 发送 Markdown 消息
 */
export async function sendMarkdownDingTalk(params: {
  cfg: ClawdbotConfig;
  to: string;
  markdown: string;
  sessionWebhook?: string;
  atUserIds?: string[];
}): Promise<void> {
  const { cfg, to, markdown, sessionWebhook, atUserIds = [] } = params;
  const dingtalkCfg = cfg.channels?.dingtalk as DingTalkConfig | undefined;
  const creds = resolveDingTalkCredentials(dingtalkCfg);
  
  if (!creds) {
    throw new Error("DingTalk credentials not configured");
  }

  const runtime = getDingTalkRuntime();
  const log = runtime.log ?? console.log;
  const error = runtime.error ?? console.error;

  try {
    log(`dingtalk: sending markdown to ${to}: ${markdown.slice(0, 100)}...`);

    // 获取 access token
    const accessToken = await getAccessToken(creds.appKey, creds.appSecret);

    if (sessionWebhook) {
      await sendMessageViaWebhook({
        sessionWebhook,
        accessToken,
        content: markdown,
        msgtype: "markdown",
        atUserIds,
      });
      log(`dingtalk: markdown sent successfully via webhook`);
    } else {
      throw new Error("sessionWebhook is required for sending markdown");
    }
  } catch (err) {
    error(`dingtalk: failed to send markdown: ${String(err)}`);
    throw err;
  }
}
