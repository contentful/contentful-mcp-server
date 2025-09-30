import { describe, it, expect, vi } from 'vitest';
import {
  registerCreateConceptSchemeTool,
  registerDeleteConceptSchemeTool,
  registerGetConceptSchemeTool,
  registerListConceptSchemesTool,
  registerUpdateConceptSchemeTool,
} from './register.js';
import { CreateConceptSchemeToolParams } from './createConceptScheme.js';
import { GetConceptSchemeToolParams } from './getConceptScheme.js';
import { ListConceptSchemesToolParams } from './listConceptSchemes.js';
import { UpdateConceptSchemeToolParams } from './updateConceptScheme.js';
import { DeleteConceptSchemeToolParams } from './deleteConceptScheme.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('concept schemes registration helpers', () => {
  it('should register all concept scheme tools', () => {
    const mockServer = {
      registerTool: vi.fn(),
    };

    registerCreateConceptSchemeTool(mockServer as unknown as McpServer);
    registerGetConceptSchemeTool(mockServer as unknown as McpServer);
    registerListConceptSchemesTool(mockServer as unknown as McpServer);
    registerUpdateConceptSchemeTool(mockServer as unknown as McpServer);
    registerDeleteConceptSchemeTool(mockServer as unknown as McpServer);

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'create_concept_scheme',
      {
        description:
          'Create a new taxonomy concept scheme in Contentful. Concept schemes organize related concepts and provide hierarchical structure for taxonomy management. The prefLabel is required and should be localized. You can optionally provide a conceptSchemeId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, and references to top-level concepts.',
        inputSchema: CreateConceptSchemeToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'get_concept_scheme',
      {
        description:
          'Retrieve a specific taxonomy concept scheme from Contentful. Returns the complete concept scheme with all its properties including prefLabel, definition, topConcepts, and other metadata.',
        inputSchema: GetConceptSchemeToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'list_concept_schemes',
      {
        description:
          'List taxonomy concept schemes in a Contentful organization. Supports pagination and filtering options. Returns a summarized view of concept schemes with essential information.',
        inputSchema: ListConceptSchemesToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'update_concept_scheme',
      {
        description:
          'Update a taxonomy concept scheme in Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. You can update any combination of fields - only the fields you provide will be changed, while others remain unchanged. Use this to modify labels, definitions, relationships, and other concept scheme properties.',
        inputSchema: UpdateConceptSchemeToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'delete_concept_scheme',
      {
        description:
          'Delete a taxonomy concept scheme from Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. This operation permanently removes the concept scheme and cannot be undone.',
        inputSchema: DeleteConceptSchemeToolParams.shape,
      },
      expect.any(Function),
    );

    expect(mockServer.registerTool).toHaveBeenCalledTimes(5);
  });
});
