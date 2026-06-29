# AIS-73: ComponentType CRUD MCP Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add MCP tools for full CRUD + publish/unpublish of the ExO `ComponentType` entity to `@contentful/mcp-tools`, following the exact conventions of the existing entry/content-type tools (read-before-write, two-phase delete, protected-environment guard).

**Architecture:** ComponentType is the **first ExO entity** in this repo. We create a new `tools/exo/` namespace under `packages/mcp-tools/src/tools`, with a `component-types/` sub-directory holding one file per operation (mirroring the `content-types/` layout). Each tool is a `xxxTool(config)` factory that builds a plain `contentful-management` client via `createToolClient`, calls the SDK's `client.componentType.*` plain API, and returns a `createSuccessResponse`. A `register.ts` assembles the tool-definition map; `ContentfulMcpTools` gains a `getComponentTypeTools()` accessor; the downstream `mcp-server` registration wires the collection in.

**Tech Stack:** TypeScript, Zod (schema/validation), Vitest (tests), Nx monorepo, `contentful-management@12.6.0-dev.3` plain client (ExO endpoints).

## Global Constraints

- **SDK version floor:** `contentful-management` must be pinned to `12.6.0-dev.3` in `packages/mcp-tools/package.json` (the only version exposing the ExO `componentType` plain API). **Already done** in this branch — do not revert it.
- **Branch:** All work on `ais-73-component-type-tools`, branched off `feat/exo`. Do **not** target `main`.
- **Read-before-write:** `upsert` (update path), `publish`, `unpublish`, and `delete` MUST `.get()` the current ComponentType first to read `sys.version` before mutating. The SDK's `publish`/`unpublish` require an explicit `version` argument.
- **Protected-environment guard:** Every write/delete tool calls `assertEnvironmentNotProtected(args.environmentId, config.protectedEnvironments)` as its first statement.
- **Two-phase delete:** `delete` uses the `buildConfirmToken` / `buildConfirmationPreview` confirmation flow keyed on `sys.version`, exactly like `deleteContentType`.
- **Error style:** Throw plain `Error`; wrap the handler in `withErrorHandling(tool, 'Error <verb> component type')`.
- **Tool naming:** snake_case titles `get_component_type`, `list_component_types`, `create_component_type`, `upsert_component_type`, `delete_component_type`, `publish_component_type`, `unpublish_component_type` (mirrors `*_content_type`).
- **Commits:** Conventional commits. Adding tools is a `feat`. Release is automated from commit messages — no manual changeset/version-bump step.
- **Cursor pagination:** `componentType.getMany` uses cursor pagination (`pageNext`/`pagePrev`, NOT `skip`) and returns `ExoCursorPaginatedCollectionProp<ComponentTypeProps>` = `{ items, total?, pages: { next?, prev? } }`.

---

## Context & Background

- **Ticket:** [AIS-73](https://contentful.atlassian.net/browse/AIS-73) — "Implement CRUD tools for ComponentType". Epic: [AIS-71](https://contentful.atlassian.net/browse/AIS-71), label `exo-mcp`.
- **ComponentType** is the foundational ExO entity: a reusable section/pattern template defining slots, content properties, and design properties.
- **Ticket vs. SDK discrepancy (resolved):** The ticket lists a `getMany` `_experienceCtId` filter. The installed `12.6.0-dev.3` SDK's `ComponentTypeQueryOptions` is `CursorPaginationParams & ExoQueryFilters & { order?: string }` — there is **no `_experienceCtId` param**. Follow the actual SDK surface. The `list_component_types` tool exposes a curated subset of `ExoQueryFilters` plus cursor params.

### SDK surface (verified — `node_modules/contentful-management/dist/types/plain/entities/component-type.d.ts`)

```typescript
client.componentType.getMany(params: GetSpaceEnvironmentParams & { query: ComponentTypeQueryOptions }): Promise<ExoCursorPaginatedCollectionProp<ComponentTypeProps>>
client.componentType.get(params: GetComponentTypeParams): Promise<ComponentTypeProps>
client.componentType.create(params: GetSpaceEnvironmentParams, rawData: CreateComponentTypeProps): Promise<ComponentTypeProps>
client.componentType.upsert(params: GetComponentTypeParams, rawData: UpsertComponentTypeProps): Promise<ComponentTypeProps>
client.componentType.delete(params: GetComponentTypeParams): Promise<void>
client.componentType.publish(params: GetComponentTypeParams & { version: number }): Promise<ComponentTypeProps>
client.componentType.unpublish(params: GetComponentTypeParams & { version: number }): Promise<ComponentTypeProps>
```

Where:
- `GetSpaceEnvironmentParams` = `{ spaceId, environmentId }`
- `GetComponentTypeParams` = `GetSpaceEnvironmentParams & { componentTypeId: string }`
- `ComponentTypeProps` = `{ sys: ComponentTypeSys, name: string, description: string, viewports: [], contentProperties: [], designProperties: [], componentTree?, slots?, metadata?, dataAssemblies?, source? }`
- `CreateComponentTypeProps` = `Except<ComponentTypeProps, 'sys' | 'source'> & { source?: ... | null }`
- `UpsertComponentTypeProps` = `Except<ComponentTypeProps, 'sys' | 'source'> & { sys: { id: string, type: 'ComponentType', version?: number }, source?: ... | null }`

### Key Files

| File | Responsibility | Change |
|------|----------------|--------|
| `packages/mcp-tools/src/utils/confirmation.ts` | Destructive-resource confirmation tokens | Add `'componentType'` to `DestructiveResource` union + `RESOURCE_DISPLAY_NAME` |
| `packages/mcp-tools/src/tools/exo/component-types/getComponentType.ts` | `get` tool | Create |
| `packages/mcp-tools/src/tools/exo/component-types/listComponentTypes.ts` | `getMany` tool | Create |
| `packages/mcp-tools/src/tools/exo/component-types/createComponentType.ts` | `create` tool | Create |
| `packages/mcp-tools/src/tools/exo/component-types/upsertComponentType.ts` | `upsert` tool (read-before-write update) | Create |
| `packages/mcp-tools/src/tools/exo/component-types/deleteComponentType.ts` | `delete` tool (two-phase) | Create |
| `packages/mcp-tools/src/tools/exo/component-types/publishComponentType.ts` | `publish` tool (read version first) | Create |
| `packages/mcp-tools/src/tools/exo/component-types/unpublishComponentType.ts` | `unpublish` tool (read version first) | Create |
| `packages/mcp-tools/src/tools/exo/component-types/mockClient.ts` | Shared test mocks | Create |
| `packages/mcp-tools/src/tools/exo/component-types/*.test.ts` | Per-tool unit tests | Create |
| `packages/mcp-tools/src/tools/exo/component-types/register.ts` | Tool-definition map factory | Create |
| `packages/mcp-tools/src/ContentfulMcpTools.ts` | Tool collection accessors | Add `getComponentTypeTools()` |
| `packages/mcp-server/src/tools/register.ts` | Server tool registration | Add `componentTypeTools` to `allToolCollections` |
| `packages/mcp-server/src/tools/register.test.ts:74-87` | Count assertion | Add `getComponentTypeTools()` to `standardToolCollections` |

### Conventions to follow (verbatim from existing tools)

- Schemas extend `BaseToolSchema` (`{ spaceId, environmentId }`) from `../../../utils/tools.js`. **Note the `../../../` depth** — these files live one level deeper than `content-types/` (under `exo/`).
- Import `createSuccessResponse`, `withErrorHandling` from `../../../utils/response.js`.
- Import `createToolClient`, `assertEnvironmentNotProtected` from `../../../utils/tools.js`.
- Tests import `formatResponse` from `../../../utils/formatters.js`, `createMockConfig` from `../../../test-helpers/mockConfig.js`, `buildConfirmToken` from `../../../utils/confirmation.js`.
- `createSuccessResponse(message, data)` produces `{ content: [{ type: 'text', text: formatResponse(message, data) }] }`.
- `withErrorHandling` turns a thrown `Error('X')` into `{ isError: true, content: [{ type: 'text', text: '<prefix>: X' }] }`.

---

## Task 1: Extend the confirmation util for componentType

**Files:**
- Modify: `packages/mcp-tools/src/utils/confirmation.ts`
- Test: `packages/mcp-tools/src/utils/confirmation.test.ts` (create if absent; otherwise append)

**Interfaces:**
- Produces: `DestructiveResource` now includes `'componentType'`; `buildConfirmToken('componentType', id, version)` and `buildConfirmationPreview('componentType', ...)` are callable.

- [ ] **Step 1: Write the failing test**

Create/append `packages/mcp-tools/src/utils/confirmation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  buildConfirmToken,
  buildConfirmationPreview,
} from './confirmation.js';

describe('confirmation – componentType', () => {
  it('builds a stable token for a componentType', () => {
    const a = buildConfirmToken('componentType', 'ct-1', 3);
    const b = buildConfirmToken('componentType', 'ct-1', 3);
    expect(a).toBe(b);
    expect(a).toHaveLength(16);
  });

  it('changes the token when version changes', () => {
    const v3 = buildConfirmToken('componentType', 'ct-1', 3);
    const v4 = buildConfirmToken('componentType', 'ct-1', 4);
    expect(v3).not.toBe(v4);
  });

  it('uses the component type display name in the preview', () => {
    const token = buildConfirmToken('componentType', 'ct-1', 1);
    const preview = buildConfirmationPreview(
      'componentType',
      'ct-1',
      { componentType: { sys: { id: 'ct-1' } } },
      token,
    );
    expect(preview.instructions).toContain('component type');
    expect(preview.confirmToken).toBe(token);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-tools && npx vitest run src/utils/confirmation.test.ts`
Expected: FAIL — TypeScript rejects `'componentType'` (not assignable to `DestructiveResource`).

- [ ] **Step 3: Add `componentType` to the union and display map**

In `packages/mcp-tools/src/utils/confirmation.ts`, add `| 'componentType'` to the `DestructiveResource` type:

```typescript
export type DestructiveResource =
  | 'entry'
  | 'environment'
  | 'contentType'
  | 'asset'
  | 'aiAction'
  | 'locale'
  | 'concept'
  | 'conceptScheme'
  | 'componentType';
```

And add the display-name entry to `RESOURCE_DISPLAY_NAME`:

```typescript
const RESOURCE_DISPLAY_NAME: Record<DestructiveResource, string> = {
  entry: 'entry',
  environment: 'environment',
  contentType: 'content type',
  asset: 'asset',
  aiAction: 'AI action',
  locale: 'locale',
  concept: 'concept',
  conceptScheme: 'concept scheme',
  componentType: 'component type',
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/mcp-tools && npx vitest run src/utils/confirmation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-tools/src/utils/confirmation.ts packages/mcp-tools/src/utils/confirmation.test.ts
git commit -m "feat(exo): support componentType in delete confirmation tokens [AIS-73]"
```

---

## Task 2: Shared test mock client for componentType

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/mockClient.ts`

**Interfaces:**
- Produces: hoisted mocks `mockComponentTypeGet`, `mockComponentTypeGetMany`, `mockComponentTypeCreate`, `mockComponentTypeUpsert`, `mockComponentTypeDelete`, `mockComponentTypePublish`, `mockComponentTypeUnpublish`, `mockCreateToolClient`; fixtures `mockComponentType`, `mockComponentTypesResponse`, `mockArgs`. All later test tasks import from this file.

- [ ] **Step 1: Create the mock client file**

Create `packages/mcp-tools/src/tools/exo/component-types/mockClient.ts`:

```typescript
import { vi } from 'vitest';

/**
 * Shared mock objects for ComponentType tests.
 * Mirrors the content-types mockClient pattern, adapted to the ExO
 * componentType plain client API.
 */
const {
  mockComponentTypeGet,
  mockComponentTypeGetMany,
  mockComponentTypeCreate,
  mockComponentTypeUpsert,
  mockComponentTypeDelete,
  mockComponentTypePublish,
  mockComponentTypeUnpublish,
  mockCreateToolClient,
} = vi.hoisted(() => {
  return {
    mockComponentTypeGet: vi.fn(),
    mockComponentTypeGetMany: vi.fn(),
    mockComponentTypeCreate: vi.fn(),
    mockComponentTypeUpsert: vi.fn(),
    mockComponentTypeDelete: vi.fn(),
    mockComponentTypePublish: vi.fn(),
    mockComponentTypeUnpublish: vi.fn(),
    mockCreateToolClient: vi.fn(() => {
      return {
        componentType: {
          get: mockComponentTypeGet,
          getMany: mockComponentTypeGetMany,
          create: mockComponentTypeCreate,
          upsert: mockComponentTypeUpsert,
          delete: mockComponentTypeDelete,
          publish: mockComponentTypePublish,
          unpublish: mockComponentTypeUnpublish,
        },
      };
    }),
  };
});

vi.mock('../../../utils/tools.js', async (importOriginal) => {
  const org = await importOriginal<typeof import('../../../utils/tools.js')>();
  return {
    ...org,
    createToolClient: mockCreateToolClient,
  };
});

export {
  mockComponentTypeGet,
  mockComponentTypeGetMany,
  mockComponentTypeCreate,
  mockComponentTypeUpsert,
  mockComponentTypeDelete,
  mockComponentTypePublish,
  mockComponentTypeUnpublish,
  mockCreateToolClient,
};

/**
 * Standard mock ComponentType object used across tests.
 */
export const mockComponentType = {
  sys: {
    id: 'test-component-type-id',
    type: 'ComponentType' as const,
    version: 1,
    space: {
      sys: { type: 'Link' as const, linkType: 'Space' as const, id: 'test-space-id' },
    },
    environment: {
      sys: {
        type: 'Link' as const,
        linkType: 'Environment' as const,
        id: 'test-environment',
      },
    },
    createdAt: '2023-01-01T00:00:00Z',
    createdBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
    updatedAt: '2023-01-01T00:00:00Z',
    updatedBy: { sys: { type: 'Link', linkType: 'User', id: 'user-1' } },
  },
  name: 'Test Component Type',
  description: 'A test component type for unit tests',
  viewports: [],
  contentProperties: [],
  designProperties: [],
};

/**
 * Standard test arguments for componentType operations.
 */
export const mockArgs = {
  spaceId: 'test-space-id',
  environmentId: 'test-environment',
  componentTypeId: 'test-component-type-id',
};

/**
 * Mock cursor-paginated list response.
 */
export const mockComponentTypesResponse = {
  sys: { type: 'Array' as const },
  total: 2,
  limit: 10,
  items: [
    mockComponentType,
    {
      ...mockComponentType,
      sys: { ...mockComponentType.sys, id: 'another-component-type' },
      name: 'Another Component Type',
    },
  ],
  pages: { next: 'next-cursor-token' },
};
```

- [ ] **Step 2: Verify it type-checks (no test yet)**

Run: `cd packages/mcp-tools && npx tsc --noEmit -p tsconfig.spec.json 2>&1 | grep component-types || echo "no component-types errors"`
Expected: `no component-types errors`

- [ ] **Step 3: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/mockClient.ts
git commit -m "test(exo): add shared componentType mock client [AIS-73]"
```

---

## Task 3: `get_component_type` tool

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/getComponentType.ts`
- Test: `packages/mcp-tools/src/tools/exo/component-types/getComponentType.test.ts`

**Interfaces:**
- Produces: `getComponentTypeTool(config)` returning a handler; `GetComponentTypeToolParams` zod schema (`spaceId`, `environmentId`, `componentTypeId`).

- [ ] **Step 1: Write the failing test**

Create `getComponentType.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { getComponentTypeTool } from './getComponentType.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('getComponentType', () => {
  const mockConfig = createMockConfig();

  it('retrieves a component type successfully', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);

    const tool = getComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    const expectedResponse = formatResponse(
      'Component type retrieved successfully',
      { componentType: mockComponentType },
    );
    expect(result).toEqual({
      content: [{ type: 'text', text: expectedResponse }],
    });
    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
  });

  it('handles errors when the component type is not found', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('Component type not found'));

    const tool = getComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Error retrieving component type: Component type not found',
        },
      ],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/getComponentType.test.ts`
Expected: FAIL — cannot find module `./getComponentType.js`.

- [ ] **Step 3: Write the implementation**

Create `getComponentType.ts`:

```typescript
import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const GetComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to retrieve details for'),
});

type Params = z.infer<typeof GetComponentTypeToolParams>;

export function getComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const componentType = await contentfulClient.componentType.get({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    });

    return createSuccessResponse('Component type retrieved successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error retrieving component type');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/getComponentType.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/getComponentType.ts packages/mcp-tools/src/tools/exo/component-types/getComponentType.test.ts
git commit -m "feat(exo): add get_component_type tool [AIS-73]"
```

---

## Task 4: `list_component_types` tool

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/listComponentTypes.ts`
- Test: `packages/mcp-tools/src/tools/exo/component-types/listComponentTypes.test.ts`

**Interfaces:**
- Consumes: `mockComponentTypesResponse`, `mockComponentTypeGetMany` from `mockClient.ts`.
- Produces: `listComponentTypesTool(config)`; `ListComponentTypesToolParams` schema (`spaceId`, `environmentId`, optional `limit`, `pageNext`, `pagePrev`, `order`).

- [ ] **Step 1: Write the failing test**

Create `listComponentTypes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  mockComponentTypeGetMany,
  mockComponentTypesResponse,
} from './mockClient.js';
import { listComponentTypesTool } from './listComponentTypes.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('listComponentTypes', () => {
  const mockConfig = createMockConfig();
  const baseArgs = { spaceId: 'test-space-id', environmentId: 'test-environment' };

  it('lists component types and clamps limit to 10', async () => {
    mockComponentTypeGetMany.mockResolvedValue(mockComponentTypesResponse);

    const tool = listComponentTypesTool(mockConfig);
    const result = await tool({ ...baseArgs, limit: 50 });

    expect(mockComponentTypeGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10 },
    });
    expect(result.content[0].text).toContain('Component types retrieved successfully');
  });

  it('forwards cursor and order params', async () => {
    mockComponentTypeGetMany.mockResolvedValue(mockComponentTypesResponse);

    const tool = listComponentTypesTool(mockConfig);
    await tool({ ...baseArgs, pageNext: 'cursor-1', order: 'sys.createdAt' });

    expect(mockComponentTypeGetMany).toHaveBeenCalledWith({
      spaceId: baseArgs.spaceId,
      environmentId: baseArgs.environmentId,
      query: { limit: 10, pageNext: 'cursor-1', order: 'sys.createdAt' },
    });
  });

  it('handles errors', async () => {
    mockComponentTypeGetMany.mockRejectedValue(new Error('boom'));

    const tool = listComponentTypesTool(mockConfig);
    const result = await tool(baseArgs);

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error listing component types: boom' }],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/listComponentTypes.test.ts`
Expected: FAIL — cannot find module `./listComponentTypes.js`.

- [ ] **Step 3: Write the implementation**

Create `listComponentTypes.ts`. Note: `getMany` uses **cursor** pagination (`pageNext`/`pagePrev`), not `skip`. The `summarizeData` util is used as in `listContentTypes`, capped at 10 items.

```typescript
import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import { BaseToolSchema, createToolClient } from '../../../utils/tools.js';
import { summarizeData } from '../../../utils/summarizer.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const ListComponentTypesToolParams = BaseToolSchema.extend({
  limit: z
    .number()
    .optional()
    .describe('Maximum number of component types to return (max 10)'),
  pageNext: z
    .string()
    .optional()
    .describe('Cursor token to fetch the next page of results'),
  pagePrev: z
    .string()
    .optional()
    .describe('Cursor token to fetch the previous page of results'),
  order: z
    .string()
    .optional()
    .describe('Order component types by this field (e.g. sys.createdAt)'),
});

type Params = z.infer<typeof ListComponentTypesToolParams>;

export function listComponentTypesTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    const contentfulClient = createToolClient(config, args);

    const componentTypes = await contentfulClient.componentType.getMany({
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      query: {
        limit: Math.min(args.limit || 10, 10),
        ...(args.pageNext && { pageNext: args.pageNext }),
        ...(args.pagePrev && { pagePrev: args.pagePrev }),
        ...(args.order && { order: args.order }),
      },
    });

    const summarized = summarizeData(componentTypes, {
      maxItems: 10,
      remainingMessage:
        'To see more component types, ask me to retrieve the next page using the pageNext cursor.',
    });

    return createSuccessResponse('Component types retrieved successfully', {
      componentTypes: summarized,
      total: componentTypes.total,
      limit: componentTypes.limit,
      pages: componentTypes.pages,
    });
  }

  return withErrorHandling(tool, 'Error listing component types');
}
```

> **Implementer note:** Confirm `summarizeData`'s signature in `packages/mcp-tools/src/utils/summarizer.ts` matches the `listContentTypes.ts` usage (positional `(data, options)`). If the spread of `query` with cursor params trips the SDK's `CursorPaginationParams` discriminated-union type-check under `tsc`, cast the query object `as ComponentTypeQueryOptions` (import the type from `contentful-management`). Verify with `tsc` in Step 4.

- [ ] **Step 4: Run test + type-check**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/listComponentTypes.test.ts && npx tsc --noEmit -p tsconfig.lib.json 2>&1 | grep listComponentTypes || echo "no type errors"`
Expected: PASS, then `no type errors`.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/listComponentTypes.ts packages/mcp-tools/src/tools/exo/component-types/listComponentTypes.test.ts
git commit -m "feat(exo): add list_component_types tool [AIS-73]"
```

---

## Task 5: `create_component_type` tool

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/createComponentType.ts`
- Test: `packages/mcp-tools/src/tools/exo/component-types/createComponentType.test.ts`

**Interfaces:**
- Consumes: `mockComponentTypeCreate`, `mockComponentType` from `mockClient.ts`.
- Produces: `createComponentTypeTool(config)`; `CreateComponentTypeToolParams` schema.

- [ ] **Step 1: Write the failing test**

Create `createComponentType.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeCreate,
  mockComponentType,
} from './mockClient.js';
import { createComponentTypeTool } from './createComponentType.js';
import { formatResponse } from '../../../utils/formatters.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('createComponentType', () => {
  const mockConfig = createMockConfig();
  const args = {
    spaceId: 'test-space-id',
    environmentId: 'test-environment',
    name: 'Hero',
    description: 'A hero section',
    viewports: [],
    contentProperties: [],
    designProperties: [],
  };

  beforeEach(() => vi.clearAllMocks());

  it('creates a component type successfully', async () => {
    mockComponentTypeCreate.mockResolvedValue(mockComponentType);

    const tool = createComponentTypeTool(mockConfig);
    const result = await tool(args);

    expect(mockComponentTypeCreate).toHaveBeenCalledWith(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: 'Hero',
        description: 'A hero section',
        viewports: [],
        contentProperties: [],
        designProperties: [],
      },
    );
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: formatResponse('Component type created successfully', {
            componentType: mockComponentType,
          }),
        },
      ],
    });
  });

  it('rejects writes to a protected environment', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['test-environment'],
    });

    const tool = createComponentTypeTool(protectedConfig);
    const result = await tool(args);

    expect(mockComponentTypeCreate).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/createComponentType.test.ts`
Expected: FAIL — cannot find module `./createComponentType.js`.

- [ ] **Step 3: Write the implementation**

Create `createComponentType.ts`. ComponentType structures (viewports, content/design properties, tree, slots) are complex nested shapes; following the SDK's `CreateComponentTypeProps` we accept them as passthrough objects validated loosely with zod (`z.array(z.record(z.unknown()))` / `z.unknown()`), since the SDK + API are the source of truth. `name` and `description` are required strings; the three array fields are required by `ComponentTypeProps`.

```typescript
import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const CreateComponentTypeToolParams = BaseToolSchema.extend({
  name: z.string().describe('The name of the component type'),
  description: z.string().describe('Description of the component type'),
  viewports: z
    .array(z.record(z.unknown()))
    .describe('Viewport definitions for the component type (may be empty)'),
  contentProperties: z
    .array(z.record(z.unknown()))
    .describe('Content property definitions (may be empty)'),
  designProperties: z
    .array(z.record(z.unknown()))
    .describe('Design property definitions (may be empty)'),
  componentTree: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Optional component tree node definitions'),
  slots: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Optional slot definitions'),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe('Optional ExO metadata (tags, concepts)'),
});

type Params = z.infer<typeof CreateComponentTypeToolParams>;

export function createComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const contentfulClient = createToolClient(config, args);

    const componentType = await contentfulClient.componentType.create(
      { spaceId: args.spaceId, environmentId: args.environmentId },
      {
        name: args.name,
        description: args.description,
        viewports: args.viewports,
        contentProperties: args.contentProperties,
        designProperties: args.designProperties,
        ...(args.componentTree && { componentTree: args.componentTree }),
        ...(args.slots && { slots: args.slots }),
        ...(args.metadata && { metadata: args.metadata }),
      } as Parameters<typeof contentfulClient.componentType.create>[1],
    );

    return createSuccessResponse('Component type created successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error creating component type');
}
```

- [ ] **Step 4: Run test + type-check**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/createComponentType.test.ts && npx tsc --noEmit -p tsconfig.lib.json 2>&1 | grep createComponentType || echo "no type errors"`
Expected: PASS, then `no type errors`.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/createComponentType.ts packages/mcp-tools/src/tools/exo/component-types/createComponentType.test.ts
git commit -m "feat(exo): add create_component_type tool [AIS-73]"
```

---

## Task 6: `upsert_component_type` tool (read-before-write update path)

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/upsertComponentType.ts`
- Test: `packages/mcp-tools/src/tools/exo/component-types/upsertComponentType.test.ts`

**Interfaces:**
- Consumes: `mockComponentTypeGet`, `mockComponentTypeUpsert`, `mockComponentType`, `mockArgs` from `mockClient.ts`.
- Produces: `upsertComponentTypeTool(config)`; `UpsertComponentTypeToolParams` schema (requires `componentTypeId`; optional fields merged onto the existing entity).

**Read-before-write rationale:** `upsert` is the update mechanism (PUT). To safely update an existing ComponentType we must read its current `sys.version` and merge the caller's partial changes onto the current entity — otherwise unspecified fields would be wiped. The handler `get`s first, merges, then `upsert`s with `sys.version`.

- [ ] **Step 1: Write the failing test**

Create `upsertComponentType.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypeUpsert,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { upsertComponentTypeTool } from './upsertComponentType.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('upsertComponentType', () => {
  const mockConfig = createMockConfig();

  beforeEach(() => vi.clearAllMocks());

  it('reads the current component type before updating (read-before-write)', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypeUpsert.mockResolvedValue({
      ...mockComponentType,
      name: 'Renamed',
    });

    const tool = upsertComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed' });

    // get is called first to obtain current state + version
    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    // upsert carries the current sys.version and the merged name
    const [params, body] = mockComponentTypeUpsert.mock.calls[0];
    expect(params).toEqual({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(body.sys).toEqual({
      id: mockComponentType.sys.id,
      type: 'ComponentType',
      version: mockComponentType.sys.version,
    });
    expect(body.name).toBe('Renamed');
    expect(body.description).toBe(mockComponentType.description);
    expect(result.content[0].text).toContain('Component type updated successfully');
  });

  it('preserves unspecified fields from the existing component type', async () => {
    mockComponentTypeGet.mockResolvedValue({
      ...mockComponentType,
      designProperties: [{ id: 'color', name: 'Color', type: 'String' }],
    });
    mockComponentTypeUpsert.mockResolvedValue(mockComponentType);

    const tool = upsertComponentTypeTool(mockConfig);
    await tool({ ...mockArgs, name: 'Renamed' });

    const [, body] = mockComponentTypeUpsert.mock.calls[0];
    expect(body.designProperties).toEqual([
      { id: 'color', name: 'Color', type: 'String' },
    ]);
  });

  it('rejects writes to a protected environment', async () => {
    const protectedConfig = createMockConfig({
      protectedEnvironments: ['test-environment'],
    });

    const tool = upsertComponentTypeTool(protectedConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed' });

    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(mockComponentTypeUpsert).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('not found'));

    const tool = upsertComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, name: 'Renamed' });

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error updating component type: not found' }],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/upsertComponentType.test.ts`
Expected: FAIL — cannot find module `./upsertComponentType.js`.

- [ ] **Step 3: Write the implementation**

Create `upsertComponentType.ts`:

```typescript
import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const UpsertComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to update'),
  name: z.string().optional().describe('The name of the component type'),
  description: z
    .string()
    .optional()
    .describe('Description of the component type'),
  viewports: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Viewport definitions; replaces existing viewports if provided'),
  contentProperties: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Content property definitions; replaces existing if provided'),
  designProperties: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Design property definitions; replaces existing if provided'),
  componentTree: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Component tree node definitions; replaces existing if provided'),
  slots: z
    .array(z.record(z.unknown()))
    .optional()
    .describe('Slot definitions; replaces existing if provided'),
  metadata: z
    .record(z.unknown())
    .optional()
    .describe('ExO metadata (tags, concepts); replaces existing if provided'),
});

type Params = z.infer<typeof UpsertComponentTypeToolParams>;

export function upsertComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: fetch current state to obtain sys.version and to
    // preserve fields the caller did not supply.
    const current = await contentfulClient.componentType.get(params);

    const componentType = await contentfulClient.componentType.upsert(params, {
      sys: {
        id: current.sys.id,
        type: 'ComponentType',
        version: current.sys.version,
      },
      name: args.name ?? current.name,
      description: args.description ?? current.description,
      viewports: args.viewports ?? current.viewports,
      contentProperties: args.contentProperties ?? current.contentProperties,
      designProperties: args.designProperties ?? current.designProperties,
      ...(args.componentTree ?? current.componentTree
        ? { componentTree: args.componentTree ?? current.componentTree }
        : {}),
      ...(args.slots ?? current.slots
        ? { slots: args.slots ?? current.slots }
        : {}),
      ...(args.metadata ?? current.metadata
        ? { metadata: args.metadata ?? current.metadata }
        : {}),
    } as Parameters<typeof contentfulClient.componentType.upsert>[1]);

    return createSuccessResponse('Component type updated successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error updating component type');
}
```

- [ ] **Step 4: Run test + type-check**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/upsertComponentType.test.ts && npx tsc --noEmit -p tsconfig.lib.json 2>&1 | grep upsertComponentType || echo "no type errors"`
Expected: PASS, then `no type errors`.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/upsertComponentType.ts packages/mcp-tools/src/tools/exo/component-types/upsertComponentType.test.ts
git commit -m "feat(exo): add upsert_component_type tool with read-before-write [AIS-73]"
```

---

## Task 7: `publish_component_type` and `unpublish_component_type` tools

These two are near-identical and share a test cycle (both read version first, then call the SDK with `version`).

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/publishComponentType.ts`
- Create: `packages/mcp-tools/src/tools/exo/component-types/unpublishComponentType.ts`
- Test: `packages/mcp-tools/src/tools/exo/component-types/publishComponentType.test.ts`
- Test: `packages/mcp-tools/src/tools/exo/component-types/unpublishComponentType.test.ts`

**Interfaces:**
- Consumes: `mockComponentTypeGet`, `mockComponentTypePublish`, `mockComponentTypeUnpublish`, `mockComponentType`, `mockArgs`.
- Produces: `publishComponentTypeTool(config)` / `PublishComponentTypeToolParams`; `unpublishComponentTypeTool(config)` / `UnpublishComponentTypeToolParams`.

- [ ] **Step 1: Write the failing tests**

Create `publishComponentType.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypePublish,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { publishComponentTypeTool } from './publishComponentType.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('publishComponentType', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then publishes with it', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypePublish.mockResolvedValue(mockComponentType);

    const tool = publishComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(mockComponentTypePublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
      version: mockComponentType.sys.version,
    });
    expect(result.content[0].text).toContain('Component type published successfully');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = publishComponentTypeTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('boom'));
    const tool = publishComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error publishing component type: boom' }],
    });
  });
});
```

Create `unpublishComponentType.test.ts` (identical structure, swapping publish→unpublish and the success/error strings):

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypeUnpublish,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { unpublishComponentTypeTool } from './unpublishComponentType.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('unpublishComponentType', () => {
  const mockConfig = createMockConfig();
  beforeEach(() => vi.clearAllMocks());

  it('reads the current version then unpublishes with it', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypeUnpublish.mockResolvedValue(mockComponentType);

    const tool = unpublishComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockComponentTypeGet).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(mockComponentTypeUnpublish).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
      version: mockComponentType.sys.version,
    });
    expect(result.content[0].text).toContain('Component type unpublished successfully');
  });

  it('rejects writes to a protected environment', async () => {
    const tool = unpublishComponentTypeTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });

  it('handles errors', async () => {
    mockComponentTypeGet.mockRejectedValue(new Error('boom'));
    const tool = unpublishComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);
    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Error unpublishing component type: boom' }],
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/publishComponentType.test.ts src/tools/exo/component-types/unpublishComponentType.test.ts`
Expected: FAIL — cannot find the modules.

- [ ] **Step 3: Write the implementations**

Create `publishComponentType.ts`:

```typescript
import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const PublishComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to publish'),
});

type Params = z.infer<typeof PublishComponentTypeToolParams>;

export function publishComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the publish endpoint requires the current version.
    const current = await contentfulClient.componentType.get(params);

    const componentType = await contentfulClient.componentType.publish({
      ...params,
      version: current.sys.version,
    });

    return createSuccessResponse('Component type published successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error publishing component type');
}
```

Create `unpublishComponentType.ts`:

```typescript
import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const UnpublishComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to unpublish'),
});

type Params = z.infer<typeof UnpublishComponentTypeToolParams>;

export function unpublishComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    };

    const contentfulClient = createToolClient(config, args);

    // Read before write: the unpublish endpoint requires the current version.
    const current = await contentfulClient.componentType.get(params);

    const componentType = await contentfulClient.componentType.unpublish({
      ...params,
      version: current.sys.version,
    });

    return createSuccessResponse('Component type unpublished successfully', {
      componentType,
    });
  }

  return withErrorHandling(tool, 'Error unpublishing component type');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/publishComponentType.test.ts src/tools/exo/component-types/unpublishComponentType.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/publishComponentType.ts packages/mcp-tools/src/tools/exo/component-types/publishComponentType.test.ts packages/mcp-tools/src/tools/exo/component-types/unpublishComponentType.ts packages/mcp-tools/src/tools/exo/component-types/unpublishComponentType.test.ts
git commit -m "feat(exo): add publish/unpublish_component_type tools with read-before-write [AIS-73]"
```

---

## Task 8: `delete_component_type` tool (two-phase confirmation)

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/deleteComponentType.ts`
- Test: `packages/mcp-tools/src/tools/exo/component-types/deleteComponentType.test.ts`

**Interfaces:**
- Consumes: `mockComponentTypeGet`, `mockComponentTypeDelete`, `mockComponentType`, `mockArgs`; `buildConfirmToken` from `../../../utils/confirmation.js` (now accepts `'componentType'` from Task 1).
- Produces: `deleteComponentTypeTool(config)`; `DeleteComponentTypeToolParams` (`componentTypeId`, optional `confirm`, `confirmToken`).

- [ ] **Step 1: Write the failing test**

Create `deleteComponentType.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockComponentTypeGet,
  mockComponentTypeDelete,
  mockComponentType,
  mockArgs,
} from './mockClient.js';
import { deleteComponentTypeTool } from './deleteComponentType.js';
import { buildConfirmToken } from '../../../utils/confirmation.js';
import { createMockConfig } from '../../../test-helpers/mockConfig.js';

describe('deleteComponentType', () => {
  const mockConfig = createMockConfig();
  const validToken = buildConfirmToken(
    'componentType',
    mockArgs.componentTypeId,
    mockComponentType.sys.version,
  );

  beforeEach(() => vi.clearAllMocks());

  it('returns a confirmation preview when confirm is missing', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);

    const tool = deleteComponentTypeTool(mockConfig);
    const result = await tool(mockArgs);

    expect(mockComponentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
    expect(result.content[0].text).toContain(validToken);
  });

  it('returns a preview when the confirmToken is wrong', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);

    const tool = deleteComponentTypeTool(mockConfig);
    const result = await tool({ ...mockArgs, confirm: true, confirmToken: 'wrong' });

    expect(mockComponentTypeDelete).not.toHaveBeenCalled();
    expect(result.content[0].text).toContain('Confirmation required to delete');
  });

  it('deletes when confirm is true and the token matches', async () => {
    mockComponentTypeGet.mockResolvedValue(mockComponentType);
    mockComponentTypeDelete.mockResolvedValue(undefined);

    const tool = deleteComponentTypeTool(mockConfig);
    const result = await tool({
      ...mockArgs,
      confirm: true,
      confirmToken: validToken,
    });

    expect(mockComponentTypeDelete).toHaveBeenCalledWith({
      spaceId: mockArgs.spaceId,
      environmentId: mockArgs.environmentId,
      componentTypeId: mockArgs.componentTypeId,
    });
    expect(result.content[0].text).toContain('Component type deleted successfully');
  });

  it('rejects deletes in a protected environment', async () => {
    const tool = deleteComponentTypeTool(
      createMockConfig({ protectedEnvironments: ['test-environment'] }),
    );
    const result = await tool(mockArgs);
    expect(mockComponentTypeGet).not.toHaveBeenCalled();
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('is protected');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/deleteComponentType.test.ts`
Expected: FAIL — cannot find module `./deleteComponentType.js`.

- [ ] **Step 3: Write the implementation**

Create `deleteComponentType.ts` (mirrors `deleteContentType.ts`):

```typescript
import { z } from 'zod';
import {
  createSuccessResponse,
  withErrorHandling,
} from '../../../utils/response.js';
import {
  BaseToolSchema,
  createToolClient,
  assertEnvironmentNotProtected,
} from '../../../utils/tools.js';
import {
  buildConfirmToken,
  buildConfirmationPreview,
  CONFIRMATION_MESSAGE_PREFIX,
} from '../../../utils/confirmation.js';
import type { ContentfulConfig } from '../../../config/types.js';

export const DeleteComponentTypeToolParams = BaseToolSchema.extend({
  componentTypeId: z
    .string()
    .describe('The ID of the component type to delete'),
  confirm: z
    .boolean()
    .optional()
    .describe(
      'Set to true on the second call to actually perform the deletion. Required together with confirmToken.',
    ),
  confirmToken: z
    .string()
    .optional()
    .describe(
      'Token returned by the preview call; must be supplied with confirm: true.',
    ),
});

type Params = z.infer<typeof DeleteComponentTypeToolParams>;

export function deleteComponentTypeTool(config: ContentfulConfig) {
  async function tool(args: Params) {
    assertEnvironmentNotProtected(
      args.environmentId,
      config.protectedEnvironments,
    );

    const params = {
      spaceId: args.spaceId,
      environmentId: args.environmentId,
      componentTypeId: args.componentTypeId,
    };

    const contentfulClient = createToolClient(config, args);
    const componentType = await contentfulClient.componentType.get(params);

    const expectedToken = buildConfirmToken(
      'componentType',
      args.componentTypeId,
      componentType.sys.version,
    );
    if (args.confirm !== true || args.confirmToken !== expectedToken) {
      return createSuccessResponse(
        `${CONFIRMATION_MESSAGE_PREFIX} component type`,
        buildConfirmationPreview(
          'componentType',
          args.componentTypeId,
          { componentType },
          expectedToken,
        ),
      );
    }

    await contentfulClient.componentType.delete(params);

    return createSuccessResponse('Component type deleted successfully', {
      componentTypeId: args.componentTypeId,
    });
  }

  return withErrorHandling(tool, 'Error deleting component type');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd packages/mcp-tools && npx vitest run src/tools/exo/component-types/deleteComponentType.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/deleteComponentType.ts packages/mcp-tools/src/tools/exo/component-types/deleteComponentType.test.ts
git commit -m "feat(exo): add delete_component_type tool with two-phase confirmation [AIS-73]"
```

---

## Task 9: `register.ts` — assemble the componentType tool-definition map

**Files:**
- Create: `packages/mcp-tools/src/tools/exo/component-types/register.ts`

**Interfaces:**
- Consumes: all seven tool factories + their `*ToolParams` schemas from Tasks 3–8.
- Produces: `createComponentTypeTools(config)` returning a map of tool definitions, each `{ title, description, inputParams, annotations, tool }`. Consumed by `ContentfulMcpTools.getComponentTypeTools()` (Task 10).

- [ ] **Step 1: Write the register file**

Create `register.ts` (annotations mirror content-types: reads are `readOnlyHint:true`; create/upsert are non-destructive writes; delete/publish/unpublish are `destructiveHint:true`; publish/unpublish are idempotent):

```typescript
import {
  getComponentTypeTool,
  GetComponentTypeToolParams,
} from './getComponentType.js';
import {
  listComponentTypesTool,
  ListComponentTypesToolParams,
} from './listComponentTypes.js';
import {
  createComponentTypeTool,
  CreateComponentTypeToolParams,
} from './createComponentType.js';
import {
  upsertComponentTypeTool,
  UpsertComponentTypeToolParams,
} from './upsertComponentType.js';
import {
  deleteComponentTypeTool,
  DeleteComponentTypeToolParams,
} from './deleteComponentType.js';
import {
  publishComponentTypeTool,
  PublishComponentTypeToolParams,
} from './publishComponentType.js';
import {
  unpublishComponentTypeTool,
  UnpublishComponentTypeToolParams,
} from './unpublishComponentType.js';
import type { ContentfulConfig } from '../../../config/types.js';

export function createComponentTypeTools(config: ContentfulConfig) {
  const getComponentType = getComponentTypeTool(config);
  const listComponentTypes = listComponentTypesTool(config);
  const createComponentType = createComponentTypeTool(config);
  const upsertComponentType = upsertComponentTypeTool(config);
  const deleteComponentType = deleteComponentTypeTool(config);
  const publishComponentType = publishComponentTypeTool(config);
  const unpublishComponentType = unpublishComponentTypeTool(config);

  return {
    getComponentType: {
      title: 'get_component_type',
      description:
        'Get details about a specific ExO component type (a reusable section/pattern template defining slots, content properties, and design properties).',
      inputParams: GetComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: getComponentType,
    },
    listComponentTypes: {
      title: 'list_component_types',
      description:
        'List ExO component types in a space and environment. Returns a maximum of 10 items per request; use the pageNext cursor (returned in pages.next) to paginate.',
      inputParams: ListComponentTypesToolParams.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      tool: listComponentTypes,
    },
    createComponentType: {
      title: 'create_component_type',
      description: 'Create a new ExO component type.',
      inputParams: CreateComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: createComponentType,
    },
    upsertComponentType: {
      title: 'upsert_component_type',
      description:
        'Update an existing ExO component type. The handler fetches the current component type first (read-before-write) to obtain its version and to preserve any fields you do not supply, then writes the merged result via PUT.',
      inputParams: UpsertComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: upsertComponentType,
    },
    deleteComponentType: {
      title: 'delete_component_type',
      description:
        'Delete an ExO component type. Two-phase: the first call (without confirm/confirmToken) returns a preview and a confirmToken. To complete the deletion, call again with the same componentTypeId, confirm: true, and the confirmToken from the preview.',
      inputParams: DeleteComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
      },
      tool: deleteComponentType,
    },
    publishComponentType: {
      title: 'publish_component_type',
      description: 'Publish an ExO component type.',
      inputParams: PublishComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: publishComponentType,
    },
    unpublishComponentType: {
      title: 'unpublish_component_type',
      description: 'Unpublish an ExO component type.',
      inputParams: UnpublishComponentTypeToolParams.shape,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      tool: unpublishComponentType,
    },
  };
}
```

- [ ] **Step 2: Type-check**

Run: `cd packages/mcp-tools && npx tsc --noEmit -p tsconfig.lib.json 2>&1 | grep -E "component-types|register" || echo "no errors"`
Expected: `no errors`

- [ ] **Step 3: Commit**

```bash
git add packages/mcp-tools/src/tools/exo/component-types/register.ts
git commit -m "feat(exo): assemble componentType tool collection [AIS-73]"
```

---

## Task 10: Expose `getComponentTypeTools()` on `ContentfulMcpTools`

**Files:**
- Modify: `packages/mcp-tools/src/ContentfulMcpTools.ts`
- Test: `packages/mcp-tools/src/index.test.ts` (append a coverage assertion if the file asserts on accessors; otherwise rely on Task 11's downstream test)

**Interfaces:**
- Consumes: `createComponentTypeTools` from Task 9.
- Produces: `new ContentfulMcpTools(config).getComponentTypeTools()` returns the 7-tool map. Consumed by `mcp-server` registration (Task 11).

- [ ] **Step 1: Add the import**

In `packages/mcp-tools/src/ContentfulMcpTools.ts`, add alongside the other register imports:

```typescript
import { createComponentTypeTools } from './tools/exo/component-types/register.js';
```

- [ ] **Step 2: Add the accessor method**

Inside the `ContentfulMcpTools` class, after `getContentTypeTools()`:

```typescript
  /**
   * Get ExO component type tools
   */
  getComponentTypeTools() {
    return createComponentTypeTools(this.config);
  }
```

- [ ] **Step 3: Verify the package builds + existing tests pass**

Run: `cd packages/mcp-tools && npx tsc --noEmit -p tsconfig.lib.json && npx vitest run`
Expected: type-check clean; all tests PASS (including the 7 new component-type test files).

- [ ] **Step 4: Commit**

```bash
git add packages/mcp-tools/src/ContentfulMcpTools.ts
git commit -m "feat(exo): expose getComponentTypeTools on ContentfulMcpTools [AIS-73]"
```

---

## Task 11: Register the collection in the MCP server

**Files:**
- Modify: `packages/mcp-server/src/tools/register.ts`
- Modify: `packages/mcp-server/src/tools/register.test.ts:74-87`

**Interfaces:**
- Consumes: `tools.getComponentTypeTools()` from Task 10.
- Produces: all 7 componentType tools registered with the live MCP server.

- [ ] **Step 1: Update the count assertion test first (red)**

In `packages/mcp-server/src/tools/register.test.ts`, add `mcpTools.getComponentTypeTools(),` to the `standardToolCollections` array (around line 74-87), placed next to `getContentTypeTools()`:

```typescript
    const standardToolCollections = [
      mcpTools.getAiActionTools(),
      mcpTools.getAssetTools(),
      mcpTools.getComponentTypeTools(),
      mcpTools.getContentTypeTools(),
      mcpTools.getContextTools(),
      mcpTools.getEditorInterfaceTools(),
      mcpTools.getEntryTools(),
      mcpTools.getEnvironmentTools(),
      mcpTools.getLocaleTools(),
      mcpTools.getOrgTools(),
      mcpTools.getSpaceTools(),
      mcpTools.getTagTools(),
      mcpTools.getTaxonomyTools(),
    ];
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd packages/mcp-server && npx vitest run src/tools/register.test.ts -t "should register all standard tool collections"`
Expected: FAIL — `expectedTotalCalls` now counts 7 extra tools, but `registerAllTools` hasn't registered them yet (actual < expected).

- [ ] **Step 3: Wire the collection into `register.ts`**

In `packages/mcp-server/src/tools/register.ts`, add the accessor call next to the others:

```typescript
  const aiActionTools = tools.getAiActionTools();
  const assetTools = tools.getAssetTools();
  const componentTypeTools = tools.getComponentTypeTools();
  const contentTypeTools = tools.getContentTypeTools();
```

And add `componentTypeTools` to the `allToolCollections` array:

```typescript
  const allToolCollections = [
    aiActionTools,
    assetTools,
    componentTypeTools,
    contentTypeTools,
    contextTools,
    editorInterfaceTools,
    entryTools,
    environmentTools,
    localeTools,
    orgTools,
    spaceTools,
    tagTools,
    taxonomyTools,
  ];
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd packages/mcp-server && npx vitest run src/tools/register.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/tools/register.ts packages/mcp-server/src/tools/register.test.ts
git commit -m "feat(exo): register componentType tools in the MCP server [AIS-73]"
```

---

## Task 12: Full verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Type-check both packages**

Run: `cd packages/mcp-tools && npm run typecheck && cd ../mcp-server && npm run typecheck`
Expected: both clean (no errors).

- [ ] **Step 2: Run the full test suite from the repo root**

Run: `cd /Users/tyler.pina/punk_records/repos/contentful-mcp-server && npx nx run-many -t test --all` (or `npm test` if the root script maps to it)
Expected: all packages green, including the 8 new component-type test files (7 tools + confirmation).

- [ ] **Step 3: Lint + format**

Run: `cd packages/mcp-tools && npm run lint && npm run format`
Expected: no lint errors; formatting clean (run `npm run format:fix` if needed and amend the last commit).

- [ ] **Step 4: Confirm git state**

Run: `git log --oneline feat/exo..HEAD`
Expected: ~11 focused `feat(exo)`/`test(exo)` commits on `ais-73-component-type-tools`, all referencing `[AIS-73]`, plus the pre-existing `contentful-management` bump.

---

## Self-Review Notes

- **Spec coverage:** All 7 CMA operations from the ticket are covered — getMany (Task 4), get (Task 3), create (Task 5), upsert (Task 6), delete (Task 8), publish + unpublish (Task 7). Registration plumbing in Tasks 9–11.
- **Read-before-write standard:** enforced in upsert (Task 6), publish/unpublish (Task 7), and delete (Task 8) — every mutation `.get()`s first.
- **Protected-environment guard:** present in create, upsert, publish, unpublish, delete.
- **Two-phase delete:** Task 1 extends the confirmation util; Task 8 uses it.
- **`_experienceCtId` discrepancy:** intentionally NOT implemented — the dev.3 SDK has no such param. Flagged in Context.
- **Type-consistency:** factory/schema names (`xxxComponentTypeTool` / `XxxComponentTypeToolParams`) and mock names are consistent across tasks; `register.ts` (Task 9) imports exactly those exports.
- **Import depth:** all new files use `../../../utils/...` (three levels: `exo/component-types/` → `src/`), verified against the `content-types/` two-level pattern.
