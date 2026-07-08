import { z } from 'zod';
import { outdent } from 'outdent';
import { contextStore } from './store.js';
import { withErrorHandling } from '../../utils/response.js';
import {
  CORE_INVARIANTS,
  SEARCHING_GUIDANCE,
  CONVENTIONS_GUIDANCE,
  EXO_DISPOSITION,
} from './instructions.js';
import type { ContentfulConfig } from '../../config/types.js';

export const GetInitialContextToolParams = z.object({});

type Params = z.infer<typeof GetInitialContextToolParams>;

export function hasInitialContext(): boolean {
  return contextStore.hasInitialContext();
}

export function getInitialContextTool(config: ContentfulConfig) {
  async function tool(_params: Params) {
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const sessionFacts = outdent`
      Current Contentful session:
        - Today's date: ${today}
        - Space ID: ${config.spaceId || 'Not set'}
        - Environment ID: ${config.environmentId || 'master'}
        - Organization ID: ${config.organizationId || 'Not set'}`;

    const exoBlock = config.exoToolsRegistered ? `\n\n${EXO_DISPOSITION}` : '';

    const message =
      outdent`
      You are an assistant integrated with Contentful through the Model Context Protocol (MCP). Always call this tool first.

      ${sessionFacts}

      ${CORE_INVARIANTS}

      ${SEARCHING_GUIDANCE}

      ${CONVENTIONS_GUIDANCE}
    ` + exoBlock;

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
