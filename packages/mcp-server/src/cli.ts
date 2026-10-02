import { getVersion } from './getVersion.js';

interface CliOutput {
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

const HELP_TEXT = `Usage: contentful-mcp-server [options]

Contentful MCP Server - Model Context Protocol server for Contentful

Options:
  -h, --help       display help for command
  -v, --version    display version number`;

export function handleCliInfoFlags(
  argv = process.argv.slice(2),
  output: CliOutput = {
    stdout: (message: string): void => {
      process.stdout.write(`${message}\n`);
    },
    stderr: (message: string): void => {
      process.stderr.write(`${message}\n`);
    },
  },
): boolean {
  if (argv.includes('--help') || argv.includes('-h')) {
    output.stdout(HELP_TEXT);
    return true;
  }

  if (argv.includes('--version') || argv.includes('-v')) {
    output.stdout(getVersion());
    return true;
  }

  const unknownOption = argv.find((arg) => arg.startsWith('-'));
  if (unknownOption) {
    output.stderr(`Unknown option: ${unknownOption}`);
    process.exitCode = 1;
    return true;
  }

  return false;
}
