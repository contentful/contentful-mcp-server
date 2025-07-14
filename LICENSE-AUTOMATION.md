# 🔄 License Automation

This project includes an automated license management system that keeps track of all dependencies and their licenses.

## Running the License Update Script

To update the license information automatically:

```bash
npm run update-licenses
```

This script will:

1. **Scan direct dependencies** - Runs `license-checker-rseidelsohn` and filters to only include direct dependencies from package.json
2. **Update NOTICE file** - Automatically updates the `NOTICE` file with:
   - Runtime dependencies (production)
   - Development dependencies
   - Proper formatting with package names, licenses, and npm URLs
3. **Manage license files** - Updates the `./licenses/` directory by:
   - Removing license files that are no longer needed
   - Creating new license files for any newly referenced licenses
   - Using standard license templates with Contentful copyright

## When to Run

You should run this script:

- After adding new dependencies (`npm install <package>`)
- After removing dependencies (`npm uninstall <package>`)
- Before releases to ensure compliance documentation is up to date
- As part of your CI/CD pipeline (optional)

## Output

The script will show you:

- Number of runtime vs development dependencies found
- List of unique license types discovered
- Actions taken (files created/removed)

Example output:

```
📦 Found 8 direct runtime dependencies
🛠️  Found 10 direct development dependencies
📄 Found 3 unique license types: Apache-2.0, BSD-2-Clause, MIT
```
