import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  OutputFormat,
  EntityType,
  VariableValue,
} from '../../utils/ai-actions.js';

export const InvokeAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to invoke'),
  items: z.array(
    z.object({
      entity: z
        .object({
          sys: z.object({
            id: z.string().describe('The ID of the entity'),
            type: z.literal('Link').describe('The type of the entity'),
            linkType: z
              .nativeEnum(EntityType)
              .describe('The entity type of the link'),
            version: z.number().describe('The version of the entity'),
          }),
        })
        .describe('The entity to invoke the AI action on'),
      outputFormat: z
        .nativeEnum(OutputFormat)
        .describe('The output format of the AI action'),
      variables: z
        .array(VariableValue)
        .describe('The variable assignments within the AI action invocation'),
      // targetPath: z
      //   .string()
      //   .describe('The target path of a field for the AI action invocation'),
    }),
  ),
});

type Params = z.infer<typeof InvokeAiActionToolParams>;

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);
  const aiActions = [];

  for (const field of args.items) {
    const aiAction = await contentfulClient.aiAction.invoke(
      {
        ...params,
        aiActionId: args.aiActionId,
      },
      {
        outputFormat: field.outputFormat,
        variables: field.variables,
      },
    );

    aiActions.push(aiAction);
  }

  return createSuccessResponse('AI action invoked successfully', { aiActions });
}

export const invokeAiActionTool = withErrorHandling(
  tool,
  'Error invoking AI action',
);
