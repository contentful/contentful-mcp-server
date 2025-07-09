import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { OutputFormat, VariableValue } from '../../utils/ai-actions.js';

export const InvokeAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to invoke'),
  outputFormat: z
    .nativeEnum(OutputFormat)
    .describe('The output format of the AI action'),
  variables: z
    .array(VariableValue)
    .describe('The variable assignments within the AI action invocation'),
});

type Params = z.infer<typeof InvokeAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

  const aiAction = await contentfulClient.aiAction.invoke(
    {
      ...params,
      aiActionId: args.aiActionId,
    },
    {
      outputFormat: args.outputFormat,
      variables: args.variables,
    },
  );
  return createSuccessResponse('AI action invoked successfully', { aiAction });
}

export const invokeAiActionTool = withErrorHandling(
  tool,
  'Error invoking AI action',
);
