/**
 * Clawdbot Plugin SDK 完整类型声明
 */

declare module "clawdbot/plugin-sdk" {
  export const DEFAULT_ACCOUNT_ID: string;
  export const PAIRING_APPROVED_MESSAGE: string;
  export const DEFAULT_GROUP_HISTORY_LIMIT: number;

  export interface ClawdbotConfig {
    channels?: Record<string, any>;
    messages?: {
      groupChat?: {
        historyLimit?: number;
      };
    };
  }

  export interface RuntimeEnv {
    log?: (...args: any[]) => void;
    error?: (...args: any[]) => void;
    channel: {
      routing: {
        resolveAgentRoute(params: any): any;
      };
      reply: {
        resolveEnvelopeFormatOptions(cfg: any): any;
        formatAgentEnvelope(params: any): string;
        finalizeInboundContext(params: any): any;
        dispatchReplyFromConfig(params: any): Promise<any>;
      };
    };
    system: {
      enqueueSystemEvent(message: string, options: any): void;
    };
  }

  export interface HistoryEntry {
    sender: string;
    body: string;
    timestamp: number;
    messageId: string;
  }

  export interface ChannelPlugin<T = any> {
    id: string;
    meta: {
      id: string;
      label: string;
      selectionLabel?: string;
      docsPath?: string;
      docsLabel?: string;
      blurb?: string;
      aliases?: string[];
      order?: number;
    };
    pairing?: {
      idLabel: string;
      normalizeAllowEntry: (entry: string) => string;
      notifyApproval: (params: { cfg: ClawdbotConfig; id: string }) => Promise<void>;
    };
    capabilities?: {
      chatTypes: string[];
      polls: boolean;
      threads: boolean;
      media: boolean;
      reactions: boolean;
      edit: boolean;
      reply: boolean;
    };
    agentPrompt?: {
      messageToolHints: () => string[];
    };
    groups?: {
      resolveToolPolicy: (params: any) => any;
    };
    reload?: {
      configPrefixes: string[];
    };
    configSchema?: {
      schema: any;
    };
    config: {
      listAccountIds: () => string[];
      resolveAccount: (cfg: ClawdbotConfig) => T;
      defaultAccountId: () => string;
      setAccountEnabled: (params: { cfg: ClawdbotConfig; enabled: boolean }) => ClawdbotConfig;
      deleteAccount: (params: { cfg: ClawdbotConfig }) => ClawdbotConfig;
      isConfigured: (account: T, cfg: ClawdbotConfig) => boolean;
      describeAccount: (account: T) => any;
      resolveAllowFrom: (params: { cfg: ClawdbotConfig }) => string[];
      formatAllowFrom: (params: { allowFrom: string[] }) => string[];
    };
    security?: {
      collectWarnings: (params: { cfg: ClawdbotConfig }) => string[];
    };
    setup?: {
      resolveAccountId: () => string;
      applyAccountConfig: (params: { cfg: ClawdbotConfig }) => ClawdbotConfig;
    };
    onboarding?: {
      steps: () => Promise<any[]>;
      apply: (params: { cfg: ClawdbotConfig; values: any }) => Promise<ClawdbotConfig>;
    };
    messaging?: {
      normalizeTarget: (target: string) => string;
      targetResolver: {
        looksLikeId: (id: string) => boolean;
        hint: string;
      };
    };
    directory?: {
      self: () => Promise<any>;
      listPeers: (params: any) => Promise<any[]>;
      listGroups: (params: any) => Promise<any[]>;
      listPeersLive: (params: any) => Promise<any[]>;
      listGroupsLive: (params: any) => Promise<any[]>;
    };
    outbound?: {
      sendText: (params: { cfg: ClawdbotConfig; to: string; text: string }) => Promise<any>;
    };
    status?: {
      defaultRuntime: any;
      buildChannelSummary: (params: { snapshot: any }) => any;
      probeAccount: (params: any) => Promise<any>;
      buildAccountSnapshot: (params: { account: T; runtime: any }) => any;
    };
    gateway?: {
      startAccount: (ctx: any) => Promise<void>;
    };
  }

  export interface ClawdbotPluginApi {
    runtime: RuntimeEnv;
    registerChannel(options: { plugin: ChannelPlugin }): void;
  }

  export function emptyPluginConfigSchema(): object;

  export function buildPendingHistoryContextFromMap(params: {
    historyMap: Map<string, HistoryEntry[]>;
    historyKey: string;
    limit: number;
    currentMessage: string;
    formatEntry: (entry: HistoryEntry) => string;
  }): string;
}
