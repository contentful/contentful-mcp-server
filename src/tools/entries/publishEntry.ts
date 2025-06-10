import { z } from 'zod';
import {
    createSuccessResponse,
    withErrorHandling,
} from '../../utils/response.js';
import {BaseToolSchema, createToolClient } from '../../utils/tools.js';

export const PublishEntryToolParams = BaseToolSchema.extend({
    entryId: z.union([
        z.string(),
        z.array(z.string()).max(100)
    ]).describe('The ID of the entry to publish (string) or an array of entry IDs (up to 100 entries)'),
});

type Params = z.infer<typeof PublishEntryToolParams>;

async function tool(args: Params) {
    const baseParams = {
        spaceId: args.spaceId,
        environmentId: args.environmentId,
    };

    const contentfulClient = createToolClient(args);

    // Normalize input to always be an array (bulk operation)
    const entryIds = Array.isArray(args.entryId) ? args.entryId : [args.entryId];
    const publishedEntries = [];
    const errors = [];

    // Process all entries as bulk operation
    for (const entryId of entryIds) {
        try {
            const params = {
                ...baseParams,
                entryId,
            };

            // Get the entry first
            const entry = await contentfulClient.entry.get(params);
            
            // Publish the entry
            const publishedEntry = await contentfulClient.entry.publish(params, entry);
            
            publishedEntries.push({
                id: publishedEntry.sys.id,
                contentType: publishedEntry.sys.contentType.sys.id,
                publishedVersion: publishedEntry.sys.publishedVersion,
            });
        } catch (error) {
            errors.push({
                entryId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    //return info about the entries that were accessed, and whether any errors occurred
    return createSuccessResponse('Entry(s) published successfully', {
        publishedEntries,
        errors,
        summary: {
            total: entryIds.length,
            successful: publishedEntries.length,
            failed: errors.length,
        },
    });
}

export const publishEntryTool = withErrorHandling(
    tool,
    'Error publishing entry',
);