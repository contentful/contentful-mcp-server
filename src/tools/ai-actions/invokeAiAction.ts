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
  const completedActions: Map<string, InvocationResult['content']> = new Map();
  let attempts = 0;

  while (completedActions.size < aiActions.length && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval));

    for (let i = 0; i < aiActions.length; i++) {
      const action = aiActions[i];

      try {
        const invocationStatus = await contentfulClient.aiActionInvocation.get({
          ...params,
          invocationId: action.sys.id,
        });

        // Check if the action is in a final state (not pending)
        const status = (invocationStatus as InvocationStatusResponse).sys
          .status;

        if (status === 'COMPLETED' && invocationStatus.result) {
          completedActions.set(action.sys.id, invocationStatus.result.content);
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
    }

    attempts++;
  }

  if (completedActions.size < aiActions.length) {
    throw new Error(
      `Polling timeout: ${completedActions.size}/${aiActions.length} actions completed after ${attempts} attempts`,
    );
  }

  const returnedActions = [];

  for (const [actionId, content] of completedActions.entries()) {
    returnedActions.push({
      actionId,
      content,
    });
  }

  return returnedActions;
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

  // Provide specific guidance on next steps
  const nextStepsGuidance = generateNextStepsGuidance(completedActions);

  return createSuccessResponse('AI action invoked and completed successfully', {
    aiActions: completedActions,
    nextStepsGuidance,
  });
}

function generateNextStepsGuidance(
  completedActions: {
    actionId: string;
    content: InvocationResult['content'];
  }[],
): string {
  let guidance = `Required next step: Now that the invocation is complete, you will take the next step to complete the workflow. This will involve a CRUD operation that will take action on each of the ${completedActions}. You will need to use the appropriate tool to do this, choose a tool depending on the type of entity the action was executed on and the description of the Ai Action.`;

  return guidance;
}

export const invokeAiActionTool = withErrorHandling(
  tool,
  'Error invoking AI action',
);
