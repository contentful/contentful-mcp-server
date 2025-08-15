import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema } from '../../../utils/tools.js';
import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { S2S_MIGRATION_INSTRUCTIONS } from './instructions.js';

export const StartSpaceToSpaceMigrationToolParams = BaseToolSchema.extend({
  startWorkflow: z
    .boolean()
    .describe(
      'Confirmation if the user wants to start the space to space migration workflow',
    ),
});

type Params = z.infer<typeof StartSpaceToSpaceMigrationToolParams>;

export const makeSpaceToSpaceMigrationTool = (tools: RegisteredTool[]) => {
  async function tool(args: Params) {
    const { startWorkflow } = args;

    tools.forEach((tool) => {
      tool.enable();
    });

    return createSuccessResponse('Space to space migration workflow started.', {
      startWorkflow,
      instructions: S2S_MIGRATION_INSTRUCTIONS,
    });
  }

  return withErrorHandling(
    tool,
    'Error starting space to space migration workflow',
  );
};
