import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleCliInfoFlags } from './cli.js';
import { getVersion } from './getVersion.js';

function createOutput() {
  return {
    stdout: vi.fn(),
    stderr: vi.fn(),
  };
}

describe('CLI metadata flags', () => {
  beforeEach(() => {
    process.exitCode = undefined;
  });

  it.each(['--help', '-h'])('prints help for %s', (flag) => {
    const output = createOutput();

    const handled = handleCliInfoFlags([flag], output);

    expect(handled).toBe(true);
    expect(output.stdout).toHaveBeenCalledWith(
      expect.stringContaining('Usage: contentful-mcp-server'),
    );
    expect(output.stderr).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it.each(['--version', '-v'])('prints version for %s', (flag) => {
    const output = createOutput();

    const handled = handleCliInfoFlags([flag], output);

    expect(handled).toBe(true);
    expect(output.stdout).toHaveBeenCalledWith(getVersion());
    expect(output.stderr).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });

  it('rejects unknown top-level options', () => {
    const output = createOutput();

    const handled = handleCliInfoFlags(
      ['--definitely-not-a-real-flag'],
      output,
    );

    expect(handled).toBe(true);
    expect(output.stderr).toHaveBeenCalledWith(
      'Unknown option: --definitely-not-a-real-flag',
    );
    expect(output.stdout).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('leaves normal server startup unhandled', () => {
    const output = createOutput();

    const handled = handleCliInfoFlags([], output);

    expect(handled).toBe(false);
    expect(output.stdout).not.toHaveBeenCalled();
    expect(output.stderr).not.toHaveBeenCalled();
    expect(process.exitCode).toBeUndefined();
  });
});
