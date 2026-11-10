import { describe, expect, it } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ContentfulMcpTools } from './ContentfulMcpTools.js';
import { createMockConfig } from './test-helpers/mockConfig.js';

type ListedProperty = Record<string, unknown>;

// Registers every tool's input params on a real MCP server and returns the JSON
// schemas a client would receive from `tools/list`.
async function listToolSchemas() {
  const tools = new ContentfulMcpTools(createMockConfig());
  const server = new McpServer({ name: 'schema-test', version: '0.0.0' });

  const getters = Object.getOwnPropertyNames(
    ContentfulMcpTools.prototype,
  ).filter((name) => /^get.+Tools$/.test(name));

  for (const getter of getters) {
    const group = (
      tools as unknown as Record<string, () => Record<string, unknown>>
    )[getter]();
    for (const [key, definition] of Object.entries(group)) {
      const inputParams = (definition as { inputParams?: object }).inputParams;
      if (!inputParams) continue;
      server.registerTool(
        `${getter}.${key}`,
        { inputSchema: inputParams as never },
        async () => ({ content: [] }),
      );
    }
  }

  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'schema-test-client', version: '0.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return (await client.listTools()).tools;
}

describe('tool input JSON schemas', () => {
  it('never advertise a property as a bare $ref', async () => {
    // A `$ref`-only property has no `type`, and some clients then send an object
    // argument as JSON text instead of an object.
    const tools = await listToolSchemas();
    const bare = tools.flatMap((tool) =>
      Object.entries(
        (tool.inputSchema.properties ?? {}) as Record<string, ListedProperty>,
      )
        .filter(([, schema]) => '$ref' in schema && !('type' in schema))
        .map(([property]) => `${tool.name}.${property}`),
    );

    expect(bare).toEqual([]);
  });

  it('inlines the return mapping on update_data_assembly', async () => {
    const tools = await listToolSchemas();
    const update = tools.find((tool) =>
      tool.name.endsWith('.updateDataAssembly'),
    );
    const returnSchema = (
      update?.inputSchema.properties as Record<string, ListedProperty>
    ).return;

    expect(returnSchema).toHaveProperty('anyOf');
    expect(returnSchema).not.toHaveProperty('$ref');
  });
});
