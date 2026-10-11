import { getVersion } from './getVersion.js';

const HELP_TEXT = `Usage: contentful-mcp-server [options]

Options:
  -h, --help       Show this help message
  -v, --version    Show the server version
`;

export type CliMetadataResult =
  | { handled: false }
  | { handled: true; exitCode: number; output: string; stream: 'stdout' }
  | { handled: true; exitCode: number; output: string; stream: 'stderr' };

export function getCliMetadataResult(args: string[]): CliMetadataResult {
  if (args.length === 0) {
    return { handled: false };
  }

  const [firstArg] = args;

  if (firstArg === '--help' || firstArg === '-h') {
    return { handled: true, exitCode: 0, output: HELP_TEXT, stream: 'stdout' };
  }

  if (firstArg === '--version' || firstArg === '-v') {
    return {
      handled: true,
      exitCode: 0,
      output: `${getVersion()}\n`,
      stream: 'stdout',
    };
  }

  if (firstArg?.startsWith('-')) {
    return {
      handled: true,
      exitCode: 1,
      output: `Unknown option: ${firstArg}\n\n${HELP_TEXT}`,
      stream: 'stderr',
    };
  }

  return { handled: false };
}

export function handleCliMetadataArgs(args = process.argv.slice(2)): boolean {
  const result = getCliMetadataResult(args);

  if (!result.handled) {
    return false;
  }

  const writer = result.stream === 'stdout' ? process.stdout : process.stderr;
  writer.write(result.output);
  process.exit(result.exitCode);
}
