const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({ 
    files: 'out/**/*.test.js',
    workspaceFolder: 'test-workspace', // The path to a workspace to open during tests.
    extensionDevelopmentPath: '../vscode-sourcemap-helper',
    mocha: {

    }
 });