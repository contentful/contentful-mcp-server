import { describe, expect, it } from 'vitest';
import { getCliMetadataResult } from './cli.js';
import { getVersion } from './getVersion.js';

describe('getCliMetadataResult', () => {
  it.each([['--help'], ['-h']])('prints help for %s', (arg) => {
    expect(getCliMetadataResult([arg])).toEqual({
      handled: true,
      exitCode: 0,
      output: expect.stringContaining('Usage: contentful-mcp-server'),
      stream: 'stdout',
    });
  });

  it.each([['--version'], ['-v']])('prints version for %s', (arg) => {
    expect(getCliMetadataResult([arg])).toEqual({
      handled: true,
      exitCode: 0,
      output: `${getVersion()}\n`,
      stream: 'stdout',
    });
  });

  it('returns an error for unknown options', () => {
    expect(getCliMetadataResult(['--definitely-not-real'])).toEqual({
      handled: true,
      exitCode: 1,
      output: expect.stringContaining('Unknown option: --definitely-not-real'),
      stream: 'stderr',
    });
  });

  it('leaves server startup arguments unhandled', () => {
    expect(getCliMetadataResult([])).toEqual({ handled: false });
    expect(getCliMetadataResult(['stdio'])).toEqual({ handled: false });
  });
});
