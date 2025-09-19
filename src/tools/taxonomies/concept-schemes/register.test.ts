import { describe, it, expect, vi } from 'vitest';
import { registerConceptSchemesTools } from './register.js';
import { CreateConceptSchemeToolParams } from './createConceptScheme.js';
import { DeleteConceptSchemeToolParams } from './deleteConceptScheme.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('registerConceptSchemesTools', () => {
  it('should register all concept scheme tools', () => {
    const mockServer = {
      tool: vi.fn(),
    };

    registerConceptSchemesTools(mockServer as unknown as McpServer);

    expect(mockServer.tool).toHaveBeenCalledWith(
      'create_concept_scheme',
      'Create a new taxonomy concept scheme in Contentful. Concept schemes organize related concepts and provide hierarchical structure for taxonomy management. The prefLabel is required and should be localized. You can optionally provide a conceptSchemeId for a user-defined ID, or let Contentful generate one automatically. You can also include definitions, notes, and references to top-level concepts.',
      CreateConceptSchemeToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledWith(
      'delete_concept_scheme',
      'Delete a taxonomy concept scheme from Contentful. Requires the concept scheme ID and version number for optimistic concurrency control. This operation permanently removes the concept scheme and cannot be undone.',
      DeleteConceptSchemeToolParams.shape,
      expect.any(Function),
    );

    expect(mockServer.tool).toHaveBeenCalledTimes(2);
  });
});
