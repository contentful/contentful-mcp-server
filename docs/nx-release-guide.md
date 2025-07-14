# NX Release Setup - Quick Reference

Releases are managed by NX and

This document provides a quick reference for the NX release configuration and usage.

## Configuration Overview

The NX release configuration is located in `nx.json` under the `release` section with the following features:

- **Fixed versioning**: All packages are versioned together
- **Conventional commits**: Automatic version bumping based on commit messages
- **GitHub releases**: Automatic GitHub release creation
- **Changelog generation**: Automatic changelog generation based on conventional commits. Please do not make manual changes to CHANGELOG.md

## Release Commands

```bash
npm run release:dry-run          # Preview a regular release
npm run release                  # Create a regular release
npm run release:version          # Only update versions
npm run release:publish          # Only publish packages
```

## Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `BREAKING CHANGE:` - Breaking changes (major version bump)
- `chore:`, `docs:`, `style:`, `refactor:`, `test:` - No version bump

## Release Process

1. Make sure all changes are committed and pushed
2. Run `npm run release:dry-run` to preview the release
3. If everything looks good, run `npm run release` to create the release
4. The process will:
   - Update package versions
   - Generate/update CHANGELOG.md
   - Create a git tag
   - Push to remote
   - Create a GitHub release
   - Publish to npm (if configured)
