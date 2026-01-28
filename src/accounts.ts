/**
 * DingTalk Account Management
 */

import type { DingTalkConfig, ResolvedDingTalkAccount } from "./types.js";
import { DEFAULT_ACCOUNT_ID } from "clawdbot/plugin-sdk";
import type { ClawdbotConfig } from "clawdbot/plugin-sdk";

export function resolveDingTalkCredentials(cfg: DingTalkConfig | undefined): {
  appKey: string;
  appSecret: string;
  agentId?: string;
} | null {
  if (!cfg || !cfg.appKey || !cfg.appSecret) {
    return null;
  }
  return {
    appKey: cfg.appKey,
    appSecret: cfg.appSecret,
    agentId: cfg.agentId,
  };
}

export function resolveDingTalkAccount(params: { cfg: ClawdbotConfig }): ResolvedDingTalkAccount {
  const { cfg } = params;
  const dingtalkCfg = cfg.channels?.dingtalk as DingTalkConfig | undefined;
  const creds = resolveDingTalkCredentials(dingtalkCfg);
  
  return {
    accountId: DEFAULT_ACCOUNT_ID,
    enabled: dingtalkCfg?.enabled ?? false,
    configured: Boolean(creds),
    appKey: creds?.appKey,
  };
}
