/**
 * DingTalk Stream Monitor
 * 基于官方 dingtalk-stream SDK 的完整实现
 * https://github.com/open-dingtalk/dingtalk-stream-sdk-nodejs
 */

import type { ClawdbotConfig, RuntimeEnv, HistoryEntry } from "clawdbot/plugin-sdk";
import type { DingTalkConfig } from "./types.js";
import { resolveDingTalkCredentials } from "./accounts.js";
import { handleDingTalkMessage, type DingTalkMessageEvent } from "./bot.js";

// @ts-ignore - dingtalk-stream 可能没有 TypeScript 类型定义
import { DWClient, DWClientDownStream, TOPIC_ROBOT } from "dingtalk-stream";

export type MonitorDingTalkOpts = {
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  accountId?: string;
};

let activeClient: any = null;

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
    const client = new DWClient({
      clientId: creds.appKey,
      clientSecret: creds.appSecret,
    });

    activeClient = client;

    // 注册机器人消息回调
    client.registerCallbackListener(TOPIC_ROBOT, async (res: DWClientDownStream) => {
      try {
        log(`dingtalk: received raw message: ${JSON.stringify(res.data).slice(0, 200)}`);

        const eventData = JSON.parse(res.data);
        
        // 构建标准消息事件
        const messageEvent: DingTalkMessageEvent = {
          msgtype: eventData.msgtype || "text",
          text: eventData.text,
          senderStaffId: eventData.senderStaffId,
          senderNick: eventData.senderNick,
          chatbotUserId: eventData.chatbotUserId,
          conversationId: eventData.conversationId,
          conversationType: eventData.conversationType,
          msgId: eventData.msgId,
          atUsers: eventData.atUsers,
          sessionWebhook: eventData.sessionWebhook, // 保存 webhook 用于回复
        };

        // 调用消息处理器
        await handleDingTalkMessage({
          cfg,
          event: messageEvent,
          runtime: opts.runtime,
          chatHistories,
        });

        // 确认消息已处理（避免重复接收）
        // EventAck 是一个对象，不需要 new
        client.socketCallBackResponse(res.headers.messageId, {});
        
        log(`dingtalk: message ${eventData.msgId} processed successfully`);
      } catch (err) {
        error(`dingtalk: failed to process message: ${String(err)}`);
        // 即使处理失败，也要确认消息（避免无限重试）
        try {
          client.socketCallBackResponse(res.headers.messageId, {});
        } catch (ackErr) {
          error(`dingtalk: failed to ack message: ${String(ackErr)}`);
        }
      }
    });

    log("dingtalk: connecting to Stream server...");

    // 连接到 DingTalk Stream 服务器
    await client.connect();

    log("dingtalk: ✅ Stream connection established successfully!");
    log("dingtalk: waiting for messages...");

    // 保持连接直到收到中止信号
    return new Promise<void>((resolve, reject) => {
      const handleAbort = () => {
        log("dingtalk: received abort signal, disconnecting...");
        try {
          if (activeClient) {
            activeClient.disconnect?.();
            activeClient = null;
          }
          log("dingtalk: disconnected successfully");
          resolve();
        } catch (err) {
          error(`dingtalk: error during disconnect: ${String(err)}`);
          resolve(); // 即使断开失败也要 resolve
        }
      };

      // 监听中止信号
      if (opts.abortSignal?.aborted) {
        handleAbort();
        return;
      }

      opts.abortSignal?.addEventListener("abort", handleAbort, { once: true });

      // 监听客户端错误
      client.on?.("error", (err: Error) => {
        error(`dingtalk: client error: ${err.message}`);
        // 不要 reject，让 Clawdbot 决定是否重启
      });

      // 监听断开连接
      client.on?.("disconnect", () => {
        log("dingtalk: client disconnected");
        if (!opts.abortSignal?.aborted) {
          // 如果不是主动断开，可能需要重连
          log("dingtalk: unexpected disconnect, Clawdbot will handle reconnection");
        }
        resolve();
      });
    });
  } catch (err) {
    error(`dingtalk: failed to initialize Stream client: ${String(err)}`);
    activeClient = null;
    throw err;
  }
}

export function stopDingTalkMonitor(): void {
  if (activeClient) {
    try {
      activeClient.disconnect?.();
      activeClient = null;
    } catch (err) {
      console.error(`dingtalk: error stopping monitor: ${String(err)}`);
    }
  }
}
