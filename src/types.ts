/**
 * DingTalk Channel 类型定义
 * 参照飞书插件的结构
 */

export type DingTalkConfig = {
  enabled?: boolean;
  appKey: string;
  appSecret: string;
  agentId?: string;
  dmPolicy?: "open" | "pairing" | "allowlist";
  allowFrom?: string[];
  groupPolicy?: "open" | "allowlist" | "disabled";
  groupAllowFrom?: string[];
  requireMention?: boolean;
  historyLimit?: number;
};

export type ResolvedDingTalkAccount = {
  accountId: string;
  enabled: boolean;
  configured: boolean;
  appKey?: string;
};

export type DingTalkMessageContext = {
  chatId: string;
  messageId: string;
  senderId: string;
  senderName?: string;
  chatType: "p2p" | "group";
  mentionedBot: boolean;
  content: string;
  contentType: string;
};

export type DingTalkSendResult = {
  messageId: string;
  chatId: string;
};

export type DingTalkProbeResult = {
  ok: boolean;
  error?: string;
  appKey?: string;
  botName?: string;
};
