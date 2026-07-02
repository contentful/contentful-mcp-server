import { z } from 'zod';
import { withErrorHandling } from '../../utils/response.js';
import { GUIDANCE, GUIDANCE_TOPICS } from './instructions.js';

export const GetGuidanceToolParams = z.object({
  topic: z
    .enum(GUIDANCE_TOPICS)
    .describe(
      `The guidance topic to retrieve. One of: ${GUIDANCE_TOPICS.join(', ')}.`,
    ),
});

type Params = z.infer<typeof GetGuidanceToolParams>;

export function getGuidanceTool() {
  async function tool(params: Params) {
    const section = GUIDANCE[params.topic];
    if (!section) {
      throw new Error(
        `Unknown guidance topic "${params.topic}". Valid topics: ${GUIDANCE_TOPICS.join(', ')}.`,
      );
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: section,
        },
      ],
    };
  }

  return withErrorHandling(tool, 'Error getting guidance');
}
