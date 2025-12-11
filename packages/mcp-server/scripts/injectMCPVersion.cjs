const fs = require('fs');
const path = require('path');
const sdkVersionFilePath = path.resolve(__dirname, '../src/mcpVersion.ts');

/*
This script creates a file `sdkVersion.ts` in the `src` directory with the current SDK version, and 
is usually ran before each build to ensure the file exists
*/

fs.writeFileSync(
  sdkVersionFilePath,
  `export const MCP_VERSION = '${process.env.npm_package_version}';\n`,
  { flag: 'w' },
);
