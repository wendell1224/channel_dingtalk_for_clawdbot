import type { ClawdbotPluginApi } from "clawdbot/plugin-sdk";
import { emptyPluginConfigSchema } from "clawdbot/plugin-sdk";

import { dingtalk } from "./src/index.js";

const plugin = {
  id: "dingtalk",
  name: "DingTalk",
  description: "DingTalk Stream mode channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: ClawdbotPluginApi) {
    console.log('[DingTalk Plugin] Registering DingTalk channel...');
    api.registerChannel({ plugin: dingtalk });
    console.log('[DingTalk Plugin] DingTalk channel registered successfully!');
  },
};

export default plugin;
