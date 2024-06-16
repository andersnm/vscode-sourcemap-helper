# VSCode Sourcemap Helper

Sourcemap Helper is a VSCode extension that provides various embellishments using sourcemaps: hover, code action, inline/remote content. When you find yourself in the middle of some minified code and just want to have a peek at the original code.

## Sourcemap links

Open the sourcemap from a generated file by `Ctrl/Cmd+Click` on the sourcemap URL following `//# sourceMappingURL=$(FILE/URL)`. Supports relative and  absolute paths, inline `data:`, `file:`, `http:` and `https:` schemes.

## Hover support

Preview the original source code by hovering the mouse over some generated code. The hover preview links to the original source code.

## Code action

Provides lightbulb code action to navigate the original source when the cursor is positioned on some generated code.

## Commands

Currently there is only one command available:

### **Source Map: Navigate _(Shift+F7)_**

Navigates (opens in separate tab) original source of transpiled/generated file from current tab with cursor, located at corresponding location.

## Text providers

Internally, the extension registers text providers for multiple custom URI schemes to load and preview sourcemaps and source files from different sources.

- `sourcemap:` encodes an inline sourcemap and it's relative base URI
- `sourcemap-source:` encodes the filename of a source file relative to a sourcemap
- `sourcemap-http(s):` is a plain URL with renamed scheme

Generally source files are loaded using the `file:` scheme if the file exists, otherwise the source is loaded using the indirect `sourcemap-source:` URI representation. First it computes and attempts to load the source URI directly, but if it fails, falls back to using the `sourcesContent` from the sourcemap.

## Release Notes

### 1.0.0

The initial release based https://github.com/vladimir-kotikov/vscode-sourcemaps-navigator v0.0.3 by Vladimir Kotikov.
