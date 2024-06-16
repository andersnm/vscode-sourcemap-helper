# VSCode Sourcemap Helper

Monorepo for the VSCode Sourcemap Helper extension.

![main branch](https://github.com/andersnm/vscode-sourcemap-helper/actions/workflows/build.yml/badge.svg?branch=main)

## Getting started

```bash
# Install dependencies for all projects
npm install

# Build all projects
npm run build

# Run tests
npm run test

# Bundle project with dependencies to single file js
npm run bundle

# Create extension VSIX from bundle
npm run vsce

# Publish extension VSIX
npm run publish -- -p ${VSCE_PAT}
```

The extension is saved in `packages/vscode-sourcemap-helper/sourcemap-helper-(VERSION).vsix`

Projects:

- [vscode-sourcemap-helper](./packages/vscode-sourcemap-helper/)
- [vscode-sourcemap-helper-test](./packages/vscode-sourcemap-helper-test/)

## Shout outs

Based on https://github.com/vladimir-kotikov/vscode-sourcemaps-navigator by Vladimir Kotikov.
