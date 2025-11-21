import { z } from 'zod';
import { outdent } from 'outdent';
import { contextStore } from './store.js';
import { withErrorHandling } from '../../utils/response.js';
import { MCP_INSTRUCTIONS } from './instructions.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetInitialContextToolParams = z.object({});

type Params = z.infer<typeof GetInitialContextToolParams>;

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext();
}

export function getInitialContextTool(config: ContentfulConfig) {
  async function tool(_params: Params) {
    const configInfo = `Current Contentful Configuration:
  - Space ID: ${config.spaceId || 'Not set'}
  - Environment ID: ${config.environmentId || 'master'}
  - Organization ID: ${config.organizationId || 'Not set'}`;

    const todaysDate = new Date().toLocaleDateString('en-US');

    const message = outdent`
    ${MCP_INSTRUCTIONS}

    This is the initial context for your Contentful instance:

    <context>
      ${configInfo}
    </content>

    <todaysDate>${todaysDate}</todaysDate>
  `;

    contextStore.setInitialContextLoaded();

    return {
      content: [
        {
          type: 'text' as const,
          text: message,
        },
      ],
    };
  }

  return withErrorHandling(tool, 'Error getting initial context');
}
