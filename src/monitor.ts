/**
 * DingTalk Stream Monitor
 * 基于官方 dingtalk-stream SDK 实现
 * 文档: https://open-dingtalk.github.io/developerpedia/docs/explore/tutorials/stream/bot/nodejs/build-bot/
 */

import type { ClawdbotConfig, RuntimeEnv, HistoryEntry } from "clawdbot/plugin-sdk";
import type { DingTalkConfig } from "./types.js";
import { resolveDingTalkCredentials } from "./accounts.js";
import { handleDingTalkMessage, type DingTalkMessageEvent } from "./bot.js";

// @ts-ignore - dingtalk-stream may not have types
import { DWClient, TOPIC_ROBOT } from "dingtalk-stream";

export type MonitorDingTalkOpts = {
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  accountId?: string;
};

let streamClient: any = null;

export async function monitorDingTalkProvider(opts: MonitorDingTalkOpts = {}): Promise<void> {
  const cfg = opts.config;
  if (!cfg) {
    throw new Error("Config is required for DingTalk monitor");
  }

  const dingtalkCfg = cfg.channels?.dingtalk as DingTalkConfig | undefined;
  const creds = resolveDingTalkCredentials(dingtalkCfg);
  if (!creds) {
    throw new Error("DingTalk credentials not configured (appKey, appSecret required)");
  }

  const log = opts.runtime?.log ?? console.log;
  const error = opts.runtime?.error ?? console.error;

  log(`dingtalk: initializing Stream client with appKey: ${creds.appKey}`);

  // 创建聊天历史记录 Map
  const chatHistories = new Map<string, HistoryEntry[]>();

  try {
    // 创建 DingTalk Stream 客户端
    streamClient = new DWClient({
      clientId: creds.appKey,
      clientSecret: creds.appSecret,
    });

    // 注册机器人消息回调监听
    streamClient.registerCallbackListener(TOPIC_ROBOT, async (res: any) => {
      const messageId = res.headers?.messageId;
      
      try {
        log(`dingtalk: received stream message (messageId: ${messageId})`);
        
        // 解析消息数据
        const messageData = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        
        // 构造 DingTalkMessageEvent
        const event: DingTalkMessageEvent = {
          msgtype: messageData.msgtype || "text",
          text: messageData.text,
          senderStaffId: messageData.senderStaffId,
          senderNick: messageData.senderNick,
          chatbotUserId: messageData.chatbotUserId,
          conversationId: messageData.conversationId,
          conversationType: messageData.conversationType || "1",
          msgId: messageData.msgId || messageId,
          atUsers: messageData.atUsers || [],
          sessionWebhook: messageData.sessionWebhook, // 用于回复消息
        };

        log(`dingtalk: processing message from ${event.senderStaffId} in ${event.conversationId}`);

        // 调用消息处理函数
        await handleDingTalkMessage({
          cfg,
          event,
          runtime: opts.runtime,
          chatHistories,
        });

        // 返回成功响应（避免钉钉重复推送）
        const response = {
          success: true,
          timestamp: Date.now(),
        };
        
        if (messageId && streamClient.socketCallBackResponse) {
          streamClient.socketCallBackResponse(messageId, response);
          log(`dingtalk: sent ack for message ${messageId}`);
        }
      } catch (err) {
        error(`dingtalk: error processing message ${messageId}: ${String(err)}`);
        
        // 即使出错也要回复，避免重试
        if (messageId && streamClient.socketCallBackResponse) {
          streamClient.socketCallBackResponse(messageId, {
            success: false,
            error: String(err),
          });
        }
      }
    });

    log("dingtalk: connecting to Stream server...");

    // 启动 Stream 连接
    await streamClient.connect();

    log("dingtalk: Stream client connected successfully");

    // 保持运行直到收到中止信号
    return new Promise((resolve, reject) => {
      const handleAbort = async () => {
        log("dingtalk: received abort signal, disconnecting...");
        try {
          if (streamClient && streamClient.disconnect) {
            await streamClient.disconnect();
          }
          streamClient = null;
          log("dingtalk: disconnected successfully");
          resolve();
        } catch (err) {
          error(`dingtalk: error during disconnect: ${String(err)}`);
          resolve(); // 仍然 resolve，避免阻塞
        }
      };

      if (opts.abortSignal?.aborted) {
        handleAbort();
        return;
      }

      opts.abortSignal?.addEventListener("abort", handleAbort, { once: true });

      // 监听连接错误
      if (streamClient && streamClient.on) {
        streamClient.on("error", (err: Error) => {
          error(`dingtalk: Stream client error: ${String(err)}`);
        });

        streamClient.on("disconnect", () => {
          log("dingtalk: Stream client disconnected");
        });
      }
    });
  } catch (err) {
    error(`dingtalk: failed to initialize Stream client: ${String(err)}`);
    throw err;
  }
}

export function stopDingTalkMonitor(): void {
  if (streamClient && streamClient.disconnect) {
    streamClient.disconnect();
    streamClient = null;
  }
}
