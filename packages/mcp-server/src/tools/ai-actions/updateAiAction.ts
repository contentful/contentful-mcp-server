import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { VariableType } from '../../utils/ai-actions.js';
import { AiActionTestCaseSchema } from '../../types/aiActionTestCaseSchema.js';

export const UpdateAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to update'),
  name: z.string().optional().describe('The name of the AI action'),
  description: z
    .string()
    .optional()
    .describe('The description of the AI action'),
  instruction: z
    .object({
      template: z.string().describe('The template for the AI action'),
      variables: z
        .array(
          z.object({
            id: z.string().describe('The id of the variable'),
            name: z.string().optional().describe('The name of the variable'),
            type: z
              .nativeEnum(VariableType)
              .describe('The type of the variable'),
            description: z
              .string()
              .optional()
              .describe('The description of the variable'),
          }),
        )
        .describe('Array of variables for the AI action'),
    })
    .optional()
    .describe('The instruction for the AI action'),
  configuration: z
    .object({
      modelType: z.string().describe('The type of model to use'),
      modelTemperature: z.number().describe('The temperature for the model'),
    })
    .optional()
    .describe('The configuration for the AI action'),
  testCases: z
    .array(AiActionTestCaseSchema)
    .optional()
    .describe('Test cases for the AI action'),
});

type Params = z.infer<typeof UpdateAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    aiActionId: args.aiActionId,
  };

  const contentfulClient = createToolClient(args);

  // Get existing AI action, merge fields, and update
  const existingAiAction = await contentfulClient.aiAction.get(params);
  const updatedAiAction = await contentfulClient.aiAction.update(params, {
    ...existingAiAction,
    ...(args.name && { name: args.name }),
    ...(args.description && { description: args.description }),
    ...(args.instruction && { instruction: args.instruction }),
    ...(args.configuration && { configuration: args.configuration }),
    ...(args.testCases && { testCases: args.testCases }),
  });

  return createSuccessResponse('AI action updated successfully', {
    updatedAiAction,
  });
}

export const updateAiActionTool = withErrorHandling(
  tool,
  'Error updating AI action',
);
