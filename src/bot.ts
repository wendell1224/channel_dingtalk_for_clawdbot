/**
 * DingTalk Bot Message Handler
 * 参照飞书插件的消息处理逻辑
 */

import type { ClawdbotConfig, RuntimeEnv, HistoryEntry } from "clawdbot/plugin-sdk";
import { buildPendingHistoryContextFromMap, DEFAULT_GROUP_HISTORY_LIMIT } from "clawdbot/plugin-sdk";
import type { DingTalkConfig, DingTalkMessageContext } from "./types.js";
import { getDingTalkRuntime } from "./runtime.js";

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

    const route = core.channel.routing.resolveAgentRoute({
      cfg,
      channel: "dingtalk",
      peer: {
        kind: isGroup ? "group" : "dm",
        id: isGroup ? ctx.chatId : ctx.senderId,
      },
    });

    const preview = ctx.content.replace(/\s+/g, " ").slice(0, 160);
    const inboundLabel = isGroup
      ? `DingTalk message in group ${ctx.chatId}`
      : `DingTalk DM from ${ctx.senderId}`;

    core.system.enqueueSystemEvent(`${inboundLabel}: ${preview}`, {
      sessionKey: route.sessionKey,
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
      SessionKey: route.sessionKey,
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

    // 创建简单的 dispatcher
    const dispatcher = async (text: string) => {
      // TODO: 实际发送消息到钉钉
      log(`dingtalk: would send reply to ${ctx.chatId}: ${text.slice(0, 100)}`);
    };

    const replyOptions = {};

    log(`dingtalk: dispatching to agent (session=${route.sessionKey})`);

    await core.channel.reply.dispatchReplyFromConfig({
      ctx: ctxPayload,
      cfg,
      dispatcher,
      replyOptions,
    });

    log(`dingtalk: dispatch complete`);
  } catch (err) {
    error(`dingtalk: failed to dispatch message: ${String(err)}`);
  }
}
