import { randomUUID } from 'node:crypto';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface ExportArtifact {
  exportDir: string;
  contentFile: string;
  errorLogFile: string;
  exportPath: string;
}

export interface ExportArtifactDependencies {
  tmpdir: () => string;
  randomUUID: () => string;
  mkdtemp: (prefix: string) => Promise<string>;
}

const defaultDependencies: ExportArtifactDependencies = {
  tmpdir,
  randomUUID,
  mkdtemp,
};

export async function createExportArtifact(
  dependencies: ExportArtifactDependencies = defaultDependencies,
): Promise<ExportArtifact> {
  const id = dependencies.randomUUID();
  const exportDir = await dependencies.mkdtemp(
    join(dependencies.tmpdir(), `contentful-mcp-export-${id}-`),
  );
  const contentFile = `${id}.json`;

  return {
    exportDir,
    contentFile,
    errorLogFile: join(exportDir, `${id}.error.json`),
    exportPath: join(exportDir, contentFile),
  };
}
