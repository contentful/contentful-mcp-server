import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import { VariableType } from '../../utils/ai-actions.js';
import { AiActionTestCaseSchema } from '../../types/aiActionTestCaseSchema.js';

export const CreateAiActionToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the AI action'),
  description: z.string().describe('The description of the AI action'),
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
    .describe('The instruction for the AI action'),
  configuration: z
    .object({
      modelType: z.string().describe('The type of model to use'),
      modelTemperature: z.number().describe('The temperature for the model'),
    })
    .describe('The configuration for the AI action'),
  testCases: z
    .array(AiActionTestCaseSchema)
    .optional()
    .describe('Test cases for the AI action'),
});

type Params = z.infer<typeof CreateAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId || 'master',
  };

  const contentfulClient = createToolClient({
    ...args,
    environmentId: args.environmentId || 'master',
  });

  const aiAction = await contentfulClient.aiAction.create(params, {
    name: args.name,
    description: args.description,
    instruction: args.instruction,
    configuration: args.configuration,
    testCases: args.testCases,
  });

  return createSuccessResponse('AI action created successfully', { aiAction });
}

export const createAiActionTool = withErrorHandling(
  tool,
  'Error creating AI action',
);
