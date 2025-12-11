const fs = require('fs');
const path = require('path');

// The function `searchAndReplaceSdkVersion` is used to find instances of the SDK version in the built dist folder
// and replace them with the current version. This is typically used during the build process to ensure
// that the correct version number is reflected in the final build.
searchAndReplaceSdkVersion(
  `./dist/**/*.{js,ts,map,d.ts}`,
  process.env.npm_package_version,
);

async function searchAndReplaceSdkVersion(pattern, replacement) {
  const filePath = path.join(__dirname, '../dist/index.js');
  const file = fs.readFileSync(filePath, 'utf8');

  const updatedData = file.replace(
    /(var MCP_VERSION = ["|'])([^["|']*)(["|'])/g,
    `$1${replacement}$3`,
  );

  fs.writeFile(filePath, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error:', err.code);
      return;
    }
  });
}
