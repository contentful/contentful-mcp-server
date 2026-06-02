import { describe, it, expect } from 'vitest';
import { assertEnvironmentNotProtected } from './tools.js';

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
