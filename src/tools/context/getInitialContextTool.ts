import { z } from 'zod';
import { outdent } from 'outdent';
import { contextStore } from './store.js';
import { withErrorHandling } from '../../utils/response.js';
import { MCP_INSTRUCTIONS } from './instructions.js';
import { env } from '../../config/env.js';

export const GetInitialContextToolParams = z.object({});

type Params = z.infer<typeof GetInitialContextToolParams>;

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext();
}

async function tool(_params: Params) {
  const config = {
    space: env.data?.SPACE_ID,
    environment: env.data?.ENVIRONMENT_ID,
  };

  const configInfo = `Current Contentful Configuration:
  - Space ID: ${config.space}
  - Environment ID: ${config.environment}`;

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

export const getInitialContextTool = withErrorHandling(
  tool,
  'Error getting initial context',
);
