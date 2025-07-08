import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const CreateAiActionToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the AI action'),
  description: z.string().describe('The description of the AI action'),
  instruction: z.string().describe('The instruction for the AI action'),
  configuration: z
    .record(z.any())
    .describe('Configuration object for the AI action'),
  testCases: z
    .array(z.any())
    .optional()
    .describe('Test cases for the AI action'),
});

type Params = z.infer<typeof CreateAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);

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
