import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema } from '../../../utils/tools.js';
import type { RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import { S2S_MIGRATION_INSTRUCTIONS } from './instructions.js';

export const S2S_TEARDOWN_INSTRUCTIONS = `
The space to space migration workflow has been concluded and all related tools have been disabled.

The workflow is now complete. You can start a new migration workflow by calling space_to_space_migration_handler with enableWorkflow=true if needed.
`;

export const SpaceToSpaceMigrationHandlerToolParams = BaseToolSchema.extend({
  enableWorkflow: z
    .boolean()
    .describe(
      'Set to true to enable the workflow tools, false to disable them and conclude the workflow',
    ),
});

type Params = z.infer<typeof SpaceToSpaceMigrationHandlerToolParams>;

export const makeSpaceToSpaceMigrationHandlerTool = (
  tools: RegisteredTool[],
) => {
  async function tool(args: Params) {
    const { enableWorkflow } = args;

    if (enableWorkflow) {
      // Enable all workflow tools
      tools.forEach((tool) => {
        if (tool) {
          tool.enable();
        }
      });

      return createSuccessResponse(
        'Space to space migration workflow started.',
        {
          enableWorkflow,
          instructions: S2S_MIGRATION_INSTRUCTIONS,
        },
      );
    } else {
      // Disable all workflow tools (but not the handler itself)
      tools.forEach((tool) => {
        if (tool) {
          tool.disable();
        }
      });

      return createSuccessResponse(
        'Space to space migration workflow concluded.',
        {
          enableWorkflow,
          instructions: S2S_TEARDOWN_INSTRUCTIONS,
        },
      );
    }
  }

  return withErrorHandling(
    tool,
    'Error managing space to space migration workflow',
  );
};
