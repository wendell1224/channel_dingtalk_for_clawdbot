/**
 * DingTalk Runtime
 * 存储 Clawdbot Runtime 的全局引用
 */

import type { RuntimeEnv } from "clawdbot/plugin-sdk";

let runtime: RuntimeEnv | null = null;

export function setDingTalkRuntime(r: RuntimeEnv): void {
  runtime = r;
}

export function getDingTalkRuntime(): RuntimeEnv {
  if (!runtime) {
    throw new Error("DingTalk runtime not initialized");
  }
  return runtime;
}
