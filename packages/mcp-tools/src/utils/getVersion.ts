import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const getVersion = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Try multiple paths to support both bundled (dist/) and source (src/utils/) contexts
  const possiblePaths = [
    join(__dirname, '../package.json'), // For bundled code (dist/index.js -> package.json)
    join(__dirname, '../../package.json'), // For source code (src/utils/getVersion.ts -> package.json)
  ];

  for (const packageJsonPath of possiblePaths) {
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version;
    }
  }

  throw new Error('Could not find package.json');
};
