/**
 * DingTalk Stream Monitor
 * 简化实现：目前仅提供框架结构
 * 等待完整的钉钉 Stream SDK 文档
 */

import type { ClawdbotConfig, RuntimeEnv, HistoryEntry } from "clawdbot/plugin-sdk";
import type { DingTalkConfig } from "./types.js";
import { resolveDingTalkCredentials } from "./accounts.js";
import { handleDingTalkMessage, type DingTalkMessageEvent } from "./bot.js";

export type MonitorDingTalkOpts = {
  config?: ClawdbotConfig;
  runtime?: RuntimeEnv;
  abortSignal?: AbortSignal;
  accountId?: string;
};

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

  log("dingtalk: Stream mode not yet fully implemented");
  log("dingtalk: waiting for complete SDK documentation");
  log(`dingtalk: configured with appKey: ${creds.appKey}`);

  // 简单的占位实现
  return new Promise((resolve) => {
    const handleAbort = () => {
      log("dingtalk: stopping");
      resolve();
    };

    if (opts.abortSignal?.aborted) {
      resolve();
      return;
    }

    opts.abortSignal?.addEventListener("abort", handleAbort, { once: true });
    
    // 保持运行直到收到中止信号
    log("dingtalk: provider started (placeholder mode)");
  });
}

export function stopDingTalkMonitor(): void {
  // Placeholder
}
