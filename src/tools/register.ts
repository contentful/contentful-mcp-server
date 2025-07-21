import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerContextTools } from './context/register.js';
import { registerEntriesTools } from './entries/register.js';
import { registerContentTypesTools } from './types/register.js';
import { registerEnvironmentTools } from './environments/register.js';
import { registerAssetTools } from './assets/register.js';
import { registerSpaceTools } from './spaces/register.js';
import { registerTagsTools } from './tags/register.js';
import { registerAiActionsTools } from './ai-actions/register.js';
import { registerLocaleTools } from './locales/register.js';

export function registerAllTools(server: McpServer) {
  registerContextTools(server);
  registerEntriesTools(server);
  registerContentTypesTools(server);
  registerEnvironmentTools(server);
  registerAssetTools(server);
  registerSpaceTools(server);
  registerTagsTools(server);
  registerAiActionsTools(server);
  registerLocaleTools(server);
}
