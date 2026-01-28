/**
 * DingTalk Channel Plugin
 * 参照 clawdbot-feishu 的架构
 */

import type { ChannelPlugin, ClawdbotConfig } from "clawdbot/plugin-sdk";
import { DEFAULT_ACCOUNT_ID, PAIRING_APPROVED_MESSAGE } from "clawdbot/plugin-sdk";
import type { ResolvedDingTalkAccount, DingTalkConfig } from "./types.js";
import { resolveDingTalkAccount, resolveDingTalkCredentials } from "./accounts.js";
import { sendMessageDingTalk } from "./send.js";

const meta = {
  id: "dingtalk",
  label: "DingTalk",
  selectionLabel: "DingTalk (钉钉)",
  docsPath: "/channels/dingtalk",
  docsLabel: "dingtalk",
  blurb: "DingTalk Stream mode - 无需公网IP",
  order: 80,
} as const;

export const dingtalkPlugin: ChannelPlugin<ResolvedDingTalkAccount> = {
  id: "dingtalk",
  meta: {
    ...meta,
  },
  pairing: {
    idLabel: "dingtalkUserId",
    normalizeAllowEntry: (entry) => entry.replace(/^(dingtalk|user):/i, ""),
    notifyApproval: async ({ cfg, id }) => {
      await sendMessageDingTalk({
        cfg,
        to: id,
        text: PAIRING_APPROVED_MESSAGE,
      });
    },
  },
  capabilities: {
    chatTypes: ["direct", "channel"],
    polls: false,
    threads: false,
    media: true,
    reactions: false,
    edit: false,
    reply: true,
  },
  agentPrompt: {
    messageToolHints: () => [
      "- DingTalk targeting: omit `target` to reply to the current conversation.",
    ],
  },
  groups: {
    resolveToolPolicy: () => ({ allowed: true, reason: null }),
  },
  reload: { configPrefixes: ["channels.dingtalk"] },
  configSchema: {
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean" },
        appKey: { type: "string" },
        appSecret: { type: "string" },
        agentId: { type: "string" },
        dmPolicy: { type: "string", enum: ["open", "pairing", "allowlist"] },
        allowFrom: { type: "array", items: { type: "string" } },
        groupPolicy: { type: "string", enum: ["open", "allowlist", "disabled"] },
        groupAllowFrom: { type: "array", items: { type: "string" } },
        requireMention: { type: "boolean" },
        historyLimit: { type: "integer", minimum: 0 },
      },
    },
  },
  config: {
    listAccountIds: () => [DEFAULT_ACCOUNT_ID],
    resolveAccount: (cfg) => resolveDingTalkAccount({ cfg }),
    defaultAccountId: () => DEFAULT_ACCOUNT_ID,
    setAccountEnabled: ({ cfg, enabled }) => ({
      ...cfg,
      channels: {
        ...cfg.channels,
        dingtalk: {
          ...cfg.channels?.dingtalk,
          enabled,
        },
      },
    }),
    deleteAccount: ({ cfg }) => {
      const next = { ...cfg } as ClawdbotConfig;
      const nextChannels = { ...cfg.channels };
      delete (nextChannels as Record<string, unknown>).dingtalk;
      if (Object.keys(nextChannels).length > 0) {
        next.channels = nextChannels;
      } else {
        delete next.channels;
      }
      return next;
    },
    isConfigured: (_account, cfg) =>
      Boolean(resolveDingTalkCredentials(cfg.channels?.dingtalk as DingTalkConfig | undefined)),
    describeAccount: (account) => ({
      accountId: account.accountId,
      enabled: account.enabled,
      configured: account.configured,
    }),
    resolveAllowFrom: ({ cfg }) =>
      (cfg.channels?.dingtalk as DingTalkConfig | undefined)?.allowFrom ?? [],
    formatAllowFrom: ({ allowFrom }) =>
      allowFrom
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .map((entry) => entry.toLowerCase()),
  },
  security: {
    collectWarnings: ({ cfg }) => {
      const dingtalkCfg = cfg.channels?.dingtalk as DingTalkConfig | undefined;
      const groupPolicy = dingtalkCfg?.groupPolicy ?? "allowlist";
      if (groupPolicy !== "open") return [];
      return [
        `- DingTalk groups: groupPolicy="open" allows any member to trigger (mention-gated). Set channels.dingtalk.groupPolicy="allowlist" to restrict.`,
      ];
    },
  },
  setup: {
    resolveAccountId: () => DEFAULT_ACCOUNT_ID,
    applyAccountConfig: ({ cfg }) => ({
      ...cfg,
      channels: {
        ...cfg.channels,
        dingtalk: {
          ...cfg.channels?.dingtalk,
          enabled: true,
        },
      },
    }),
  },
  onboarding: {
    steps: async () => [
      {
        id: "credentials",
        title: "Configure DingTalk Credentials",
        description: "Get your App Key and App Secret from DingTalk Open Platform",
        fields: [
          {
            name: "appKey",
            label: "App Key",
            type: "text",
            required: true,
          },
          {
            name: "appSecret",
            label: "App Secret",
            type: "password",
            required: true,
          },
        ],
      },
    ],
    apply: async ({ cfg, values }) => {
      return {
        ...cfg,
        channels: {
          ...cfg.channels,
          dingtalk: {
            ...cfg.channels?.dingtalk,
            enabled: true,
            appKey: values.appKey,
            appSecret: values.appSecret,
          },
        },
      };
    },
  },
  messaging: {
    normalizeTarget: (target) => target,
    targetResolver: {
      looksLikeId: (id) => Boolean(id && typeof id === "string"),
      hint: "<chatId|userId>",
    },
  },
  directory: {
    self: async () => null,
    listPeers: async () => [],
    listGroups: async () => [],
    listPeersLive: async () => [],
    listGroupsLive: async () => [],
  },
  outbound: {
    sendText: async ({ cfg, to, text }) => {
      return await sendMessageDingTalk({ cfg, to, text });
    },
  },
  status: {
    defaultRuntime: {
      accountId: DEFAULT_ACCOUNT_ID,
      running: false,
      lastStartAt: null,
      lastStopAt: null,
      lastError: null,
    },
    buildChannelSummary: ({ snapshot }) => ({
      configured: snapshot.configured ?? false,
      running: snapshot.running ?? false,
      lastStartAt: snapshot.lastStartAt ?? null,
      lastStopAt: snapshot.lastStopAt ?? null,
      lastError: snapshot.lastError ?? null,
    }),
    probeAccount: async () => ({ ok: true }),
    buildAccountSnapshot: ({ account, runtime }) => ({
      accountId: account.accountId,
      enabled: account.enabled,
      configured: account.configured,
      running: runtime?.running ?? false,
      lastStartAt: runtime?.lastStartAt ?? null,
      lastStopAt: runtime?.lastStopAt ?? null,
      lastError: runtime?.lastError ?? null,
    }),
  },
  gateway: {
    startAccount: async (ctx) => {
      const { monitorDingTalkProvider } = await import("./monitor.js");
      const dingtalkCfg = ctx.cfg.channels?.dingtalk as DingTalkConfig | undefined;
      ctx.log?.info(`starting dingtalk provider (stream mode)`);
      return monitorDingTalkProvider({
        config: ctx.cfg,
        runtime: ctx.runtime,
        abortSignal: ctx.abortSignal,
        accountId: ctx.accountId,
      });
    },
  },
};
