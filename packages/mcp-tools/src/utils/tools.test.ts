import { describe, it, expect, vi } from 'vitest';
import type { ClientOptions } from 'contentful-management';
import { createMockConfig } from '../test-helpers/mockConfig.js';
import {
  assertEnvironmentNotProtected,
  createToolClient,
  createExoToolClient,
  createClientConfig,
} from './tools.js';

const { mockCreateClient } = vi.hoisted(() => {
  return { mockCreateClient: vi.fn((_config: ClientOptions) => ({})) };
});

vi.mock('contentful-management', () => {
  return {
    default: { createClient: mockCreateClient },
    createClient: mockCreateClient,
  };
});

function getCapturedHeaders(): Record<string, string> {
  const calls = mockCreateClient.mock.calls;
  const { headers } = calls[calls.length - 1][0];
  expect(headers).toBeDefined();
  return headers as Record<string, string>;
}

describe('client-identifying headers', () => {
  const args = { spaceId: 'test-space-id', environmentId: 'test-environment' };

  it('createToolClient tags classic calls without the -exo marker', () => {
    createToolClient(createMockConfig(), args);

    const headers = getCapturedHeaders();
    expect(headers['X-Contentful-User-Agent-Tool']).toBe(
      'contentful-mcp/local-0.0.0',
    );
    expect(headers['User-Agent']).toBe('contentful-mcp/local-0.0.0');
  });

  it('createExoToolClient tags ExO calls with the -exo marker on both headers', () => {
    createExoToolClient(createMockConfig(), args);

    const headers = getCapturedHeaders();
    expect(headers['X-Contentful-User-Agent-Tool']).toBe(
      'contentful-mcp-exo/local-0.0.0',
    );
    expect(headers['User-Agent']).toBe('contentful-mcp-exo/local-0.0.0');
  });

  it('createClientConfig (org-level) uses the classic, non-exo marker', () => {
    const config = createClientConfig(createMockConfig());
    const headers = config.headers as Record<string, string>;
    expect(headers['X-Contentful-User-Agent-Tool']).toBe(
      'contentful-mcp/local-0.0.0',
    );
    expect(headers['User-Agent']).toBe('contentful-mcp/local-0.0.0');
  });

  it('defaults to the local source when mcpSource is unset', () => {
    createToolClient(createMockConfig({ mcpSource: undefined }), args);

    const headers = getCapturedHeaders();
    expect(headers['X-Contentful-User-Agent-Tool']).toBe(
      'contentful-mcp/local-0.0.0',
    );
  });

  it('tags calls from the remote server with the remote source', () => {
    createToolClient(createMockConfig({ mcpSource: 'remote' }), args);

    const headers = getCapturedHeaders();
    expect(headers['X-Contentful-User-Agent-Tool']).toBe(
      'contentful-mcp/remote-0.0.0',
    );
    expect(headers['User-Agent']).toBe('contentful-mcp/remote-0.0.0');
  });

  it('combines the remote source with the -exo marker', () => {
    createExoToolClient(createMockConfig({ mcpSource: 'remote' }), args);

    const headers = getCapturedHeaders();
    expect(headers['X-Contentful-User-Agent-Tool']).toBe(
      'contentful-mcp-exo/remote-0.0.0',
    );
    expect(headers['User-Agent']).toBe('contentful-mcp-exo/remote-0.0.0');
  });
});

describe('assertEnvironmentNotProtected', () => {
  it('does nothing when protectedEnvironments is undefined', () => {
    expect(() =>
      assertEnvironmentNotProtected('master', undefined),
    ).not.toThrow();
  });

  it('does nothing when protectedEnvironments is empty array', () => {
    expect(() => assertEnvironmentNotProtected('master', [])).not.toThrow();
  });

  it('does nothing when environmentId is not in the protected list', () => {
    expect(() =>
      assertEnvironmentNotProtected('dev', ['master', 'staging']),
    ).not.toThrow();
  });

  it('throws when environmentId matches a protected environment', () => {
    expect(() =>
      assertEnvironmentNotProtected('master', ['master', 'staging']),
    ).toThrow(
      "Environment 'master' is protected. Write and delete operations are not allowed.",
    );
  });

  it('throws when environmentId matches another protected environment', () => {
    expect(() =>
      assertEnvironmentNotProtected('staging', ['master', 'staging']),
    ).toThrow(
      "Environment 'staging' is protected. Write and delete operations are not allowed.",
    );
  });

  it('is case-sensitive (master != Master)', () => {
    expect(() =>
      assertEnvironmentNotProtected('Master', ['master']),
    ).not.toThrow();
  });
});
