import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema } from '../../../utils/tools.js';
import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';

export const S2S_TEARDOWN_INSTRUCTIONS = `
The space to space migration workflow has been concluded and all related tools have been disabled.

The workflow is now complete. You can start a new migration workflow by calling start_space_to_space_migration again if needed.
`;

export const TeardownSpaceToSpaceMigrationToolParams = BaseToolSchema.extend({
  concludeWorkflow: z
    .boolean()
    .describe(
      'Confirmation if the user wants to conclude the space to space migration workflow',
    ),
});

type Params = z.infer<typeof TeardownSpaceToSpaceMigrationToolParams>;

export const makeSpaceToSpaceTeardownTool = (tools: RegisteredTool[]) => {
  async function tool(args: Params) {
    const { concludeWorkflow } = args;

    tools.forEach((tool) => {
      tool.disable();
    });

    return createSuccessResponse(
      'Space to space migration workflow concluded.',
      {
        concludeWorkflow,
        instructions: S2S_TEARDOWN_INSTRUCTIONS,
      },
    );
  }

  return withErrorHandling(
    tool,
    'Error concluding space to space migration workflow',
  );
};
