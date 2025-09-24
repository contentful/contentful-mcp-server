import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../utils/tools.js';
import {
  OutputFormat,
  VariableValue,
  InvocationStatusResponse,
} from '../../utils/ai-actions.js';
import { InvocationResult } from 'contentful-management/dist/typings/entities/ai-action-invocation.js';

export const InvokeAiActionToolParams = BaseToolSchema.extend({
  aiActionId: z.string().describe('The ID of the AI action to invoke'),
  fields: z.array(
    z.object({
      outputFormat: z
        .nativeEnum(OutputFormat)
        .describe('The output format of the AI action'),
      variables: z
        .array(VariableValue)
        .describe('The variable assignments within the AI action invocation'),
    }),
  ),
});

type Params = z.infer<typeof InvokeAiActionToolParams>;

async function pollForCompletion(
  contentfulClient: ReturnType<typeof createToolClient>,
  params: { spaceId: string; environmentId: string; aiActionId: string },
  aiActions: Array<{ sys: { id: string } }>,
  pollInterval: number = 30000,
  maxAttempts: number = 10,
): Promise<{ actionId: string; content: InvocationResult['content'] }[]> {
  const completedActions = new Map<string, InvocationResult['content']>();

  for (
    let attempt = 0;
    attempt < maxAttempts && completedActions.size < aiActions.length;
    attempt++
  ) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    await Promise.allSettled(
      aiActions
        .filter((action) => !completedActions.has(action.sys.id)) //filter out actions that have already been completed
        .map(async (action) => {
          try {
            const invocationStatus =
              await contentfulClient.aiActionInvocation.get({
                ...params,
                invocationId: action.sys.id,
              });

            const status = (invocationStatus as InvocationStatusResponse).sys
              .status;

            if (status === 'COMPLETED' && invocationStatus.result) {
              completedActions.set(
                action.sys.id,
                invocationStatus.result.content,
              );
            } else if (status === 'FAILED' || status === 'CANCELLED') {
              throw new Error(
                `AI action ${action.sys.id} failed with status ${status}`,
              );
            }
          } catch (error) {
            console.warn(
              `Error checking status for invocation ${action.sys.id}:`,
              error,
            );
          }
        }),
    );
  }

  if (completedActions.size < aiActions.length) {
    throw new Error(
      `Polling timeout: ${completedActions.size}/${aiActions.length} actions completed after ${maxAttempts} attempts`,
    );
  }

  return Array.from(completedActions.entries()).map(([actionId, content]) => ({
    actionId,
    content,
  }));
}

async function tool(args: Params) {
  const params = {
    spaceId: args.spaceId,
    environmentId: args.environmentId,
  };

  const contentfulClient = createToolClient(args);
  const aiActions = [];

  for (const field of args.fields) {
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

  // Poll for completion
  const completedActions = await pollForCompletion(
    contentfulClient,
    { ...params, aiActionId: args.aiActionId },
    aiActions,
  );

  return createSuccessResponse('AI action invoked and completed successfully', {
    aiActions: completedActions,
    nextStepsGuidance: `Required next step: Now that the invocation is complete, you will take the next step to complete the workflow. This will involve a CRUD operation that will take action on each of the action returned in the aiActions variable. You will need to use the appropriate tool to do this, choose a tool depending on the type of entity the action was executed on and the description of the Ai Action.`,
  });
}

export const invokeAiActionTool = withErrorHandling(
  tool,
  'Error invoking AI action',
);
