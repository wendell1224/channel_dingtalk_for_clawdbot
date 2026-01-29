/**
 * DingTalk Bot Message Handler
 * 参照飞书插件的消息处理逻辑
 */

import type { ClawdbotConfig, RuntimeEnv, HistoryEntry } from "clawdbot/plugin-sdk";
import { buildPendingHistoryContextFromMap, DEFAULT_GROUP_HISTORY_LIMIT } from "clawdbot/plugin-sdk";
import type { DingTalkConfig, DingTalkMessageContext } from "./types.js";
import { getDingTalkRuntime } from "./runtime.js";
import { sendMessageDingTalk, storeSessionWebhook } from "./send.js";

// 钉钉 Stream 消息事件类型（基于官方SDK）
export type DingTalkMessageEvent = {
  msgtype: string;
  text?: {
    content: string;
  };
  senderStaffId: string;
  senderNick?: string;
  chatbotUserId: string;
  conversationId: string;
  conversationType: "1" | "2"; // 1=单聊, 2=群聊
  msgId: string;
  atUsers?: Array<{ dingtalkId: string }>;
  sessionWebhook?: string; // 用于快速回复
};

function parseDingTalkMessageEvent(event: DingTalkMessageEvent): DingTalkMessageContext {
  const content = event.text?.content || "";
  const isGroup = event.conversationType === "2";
  const mentionedBot = Boolean(
    event.atUsers?.some((u) => u.dingtalkId === event.chatbotUserId)
  );

  return {
    chatId: event.conversationId,
    messageId: event.msgId,
    senderId: event.senderStaffId,
    senderName: event.senderNick,
    chatType: isGroup ? "group" : "p2p",
    mentionedBot,
    content,
    contentType: event.msgtype,
  };
}

export async function handleDingTalkMessage(params: {
  cfg: ClawdbotConfig;
  event: DingTalkMessageEvent;
  runtime?: RuntimeEnv;
  chatHistories?: Map<string, HistoryEntry[]>;
}): Promise<void> {
  const { cfg, event, runtime, chatHistories } = params;
  const dingtalkCfg = cfg.channels?.dingtalk as DingTalkConfig | undefined;
  const log = runtime?.log ?? console.log;
  const error = runtime?.error ?? console.error;

  // 保存 sessionWebhook 用于快速回复
  if (event.sessionWebhook) {
    storeSessionWebhook(event.conversationId, event.sessionWebhook);
  }

  const ctx = parseDingTalkMessageEvent(event);
  const isGroup = ctx.chatType === "group";

  log(`dingtalk: received message from ${ctx.senderId} in ${ctx.chatId} (${ctx.chatType})`);

  const historyLimit = Math.max(
    0,
    dingtalkCfg?.historyLimit ?? cfg.messages?.groupChat?.historyLimit ?? DEFAULT_GROUP_HISTORY_LIMIT
  );

  // 群聊权限检查
  if (isGroup) {
    const groupPolicy = dingtalkCfg?.groupPolicy ?? "open";
    const requireMention = dingtalkCfg?.requireMention ?? true;

    if (requireMention && !ctx.mentionedBot) {
      log(`dingtalk: message in group ${ctx.chatId} did not mention bot`);
      return;
    }

    if (groupPolicy === "allowlist") {
      const groupAllowFrom = dingtalkCfg?.groupAllowFrom ?? [];
      if (!groupAllowFrom.includes(ctx.chatId)) {
        log(`dingtalk: group ${ctx.chatId} not in allowlist`);
        return;
      }
    }
  } else {
    // 私聊权限检查
    const dmPolicy = dingtalkCfg?.dmPolicy ?? "pairing";
    const allowFrom = dingtalkCfg?.allowFrom ?? [];

    if (dmPolicy === "allowlist" && !allowFrom.includes(ctx.senderId)) {
      log(`dingtalk: sender ${ctx.senderId} not in DM allowlist`);
      return;
    }
  }

  try {
    const core = getDingTalkRuntime();

    const dingtalkFrom = isGroup ? `dingtalk:group:${ctx.chatId}` : `dingtalk:${ctx.senderId}`;
    const dingtalkTo = isGroup ? `chat:${ctx.chatId}` : `user:${ctx.senderId}`;

    // 解析路由，但强制群聊使用主 session（临时解决方案）
    const route = core.channel.routing.resolveAgentRoute({
      cfg,
      channel: "dingtalk",
      peer: {
        kind: isGroup ? "group" : "dm",
        id: isGroup ? ctx.chatId : ctx.senderId,
      },
    });
    
    // 如果是群聊，强制使用主 session（避免需要创建群聊 session）
    const sessionKey = isGroup ? "agent:main:main" : route.sessionKey;
    log(`dingtalk: using session ${sessionKey} for ${isGroup ? "group" : "dm"} message`);

    const preview = ctx.content.replace(/\s+/g, " ").slice(0, 160);
    const inboundLabel = isGroup
      ? `DingTalk message in group ${ctx.chatId}`
      : `DingTalk DM from ${ctx.senderId}`;

    core.system.enqueueSystemEvent(`${inboundLabel}: ${preview}`, {
      sessionKey,
      contextKey: `dingtalk:message:${ctx.chatId}:${ctx.messageId}`,
    });

    const envelopeOptions = core.channel.reply.resolveEnvelopeFormatOptions(cfg);

    const body = core.channel.reply.formatAgentEnvelope({
      channel: "DingTalk",
      from: isGroup ? ctx.chatId : ctx.senderId,
      timestamp: new Date(),
      envelope: envelopeOptions,
      body: ctx.content,
    });

    log(`dingtalk: formatted body: ${body.slice(0, 200)}`);

    let combinedBody = body;
    const historyKey = isGroup ? ctx.chatId : undefined;

    if (isGroup && historyKey && chatHistories) {
      combinedBody = buildPendingHistoryContextFromMap({
        historyMap: chatHistories,
        historyKey,
        limit: historyLimit,
        currentMessage: combinedBody,
        formatEntry: (entry) =>
          core.channel.reply.formatAgentEnvelope({
            channel: "DingTalk",
            from: ctx.chatId,
            timestamp: entry.timestamp,
            body: `${entry.sender}: ${entry.body}`,
            envelope: envelopeOptions,
          }),
      });
    }

    const ctxPayload = core.channel.reply.finalizeInboundContext({
      Body: combinedBody,
      RawBody: ctx.content,
      CommandBody: ctx.content,
      From: dingtalkFrom,
      To: dingtalkTo,
      SessionKey: sessionKey,
      AccountId: route.accountId,
      ChatType: isGroup ? "group" : "direct",
      GroupSubject: isGroup ? ctx.chatId : undefined,
      SenderName: ctx.senderName || ctx.senderId,
      SenderId: ctx.senderId,
      Provider: "dingtalk" as const,
      Surface: "dingtalk" as const,
      MessageSid: ctx.messageId,
      Timestamp: Date.now(),
      WasMentioned: ctx.mentionedBot,
      CommandAuthorized: true,
      OriginatingChannel: "dingtalk" as const,
      OriginatingTo: dingtalkTo,
    });

    log(`dingtalk: ctxPayload Body: ${ctxPayload.Body.slice(0, 200)}`);
    log(`dingtalk: ctxPayload RawBody: ${ctxPayload.RawBody}`);
    log(`dingtalk: ctxPayload CommandBody: ${ctxPayload.CommandBody}`);

    // 创建符合 Clawdbot 规范的 dispatcher 对象
    const dispatcher = {
      dispatch: async (reply: string | { text: string }) => {
        try {
          const text = typeof reply === 'string' ? reply : reply?.text;
          log(`dingtalk: dispatch() called with type: ${typeof reply}, text: ${text?.slice(0, 100)}`);
          if (!text) {
            log(`dingtalk: dispatch() received empty text, skipping`);
            return;
          }
          await sendMessageDingTalk({
            cfg,
            to: ctx.chatId,
            text,
            useWebhook: true, // 优先使用 webhook
          });
          log(`dingtalk: sent reply to ${ctx.chatId}`);
        } catch (err) {
          error(`dingtalk: failed to send reply: ${String(err)}`);
        }
      },
      sendFinalReply: async (reply: string | { text: string }) => {
        try {
          const text = typeof reply === 'string' ? reply : reply?.text;
          log(`dingtalk: sendFinalReply() called with type: ${typeof reply}, text: ${text?.slice(0, 100)}`);
          if (!text) {
            log(`dingtalk: sendFinalReply() received empty text, skipping`);
            return;
          }
          await sendMessageDingTalk({
            cfg,
            to: ctx.chatId,
            text,
            useWebhook: true,
          });
          log(`dingtalk: sent final reply to ${ctx.chatId}`);
        } catch (err) {
          error(`dingtalk: failed to send final reply: ${String(err)}`);
        }
      },
      sendBlockReply: async (reply: string | { text: string }) => {
        try {
          const text = typeof reply === 'string' ? reply : reply?.text;
          log(`dingtalk: sendBlockReply() called with type: ${typeof reply}, text: ${text?.slice(0, 100)}`);
          if (!text) {
            log(`dingtalk: sendBlockReply() received empty text, skipping`);
            return;
          }
          await sendMessageDingTalk({
            cfg,
            to: ctx.chatId,
            text,
            useWebhook: true,
          });
          log(`dingtalk: sent block reply to ${ctx.chatId}`);
        } catch (err) {
          error(`dingtalk: failed to send block reply: ${String(err)}`);
        }
      },
      getQueuedCounts: () => {
        // 返回队列中的消息数量（DingTalk 是即时发送，无队列）
        return { pending: 0, final: 0 };
      },
      waitForIdle: async () => {
        log(`dingtalk: waitForIdle() called`);
        // DingTalk 消息发送是即时的，无需等待
      },
      markIdle: () => {
        log(`dingtalk: markIdle() called`);
        // 标记为空闲（占位）
      },
    };

    const replyOptions = {};

    log(`dingtalk: dispatching to agent (session=${sessionKey})`);

    const result = await core.channel.reply.dispatchReplyFromConfig({
      ctx: ctxPayload,
      cfg,
      dispatcher,
      replyOptions,
    });

    log(`dingtalk: dispatch complete, result: ${JSON.stringify(result)}`);
    
    // 如果 Agent 没有生成回复（群聊常见问题），发送一个默认回复
    if (result.queuedFinal === false && result.counts.final === 0 && result.counts.pending === 0) {
      log(`dingtalk: Agent did not generate reply, sending fallback response`);
      
      // 生成一个简单的回复
      const fallbackText = `收到你的消息：${ctx.content}\n\n小龙虾正在待命！🦞`;
      
      try {
        await sendMessageDingTalk({
          cfg,
          to: ctx.chatId,
          text: fallbackText,
          useWebhook: true,
        });
        log(`dingtalk: sent fallback reply to ${ctx.chatId}`);
      } catch (err) {
        error(`dingtalk: failed to send fallback reply: ${String(err)}`);
      }
    }
  } catch (err) {
    error(`dingtalk: failed to dispatch message: ${String(err)}`);
  }
}
