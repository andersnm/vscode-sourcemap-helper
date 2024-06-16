import * as assert from 'assert';
import * as vscode from 'vscode';

import { SourceMapStore, encodeSourceMapSourceUri, OutputChannelLogger } from 'vscode-sourcemap-helper';
// import { SourceMapStore } from '../src/SourceMapStore';
import { createServer, stopServer } from './server';
// import { encodeSourceMapSourceUri } from '../src/UriHelper';
import { SourceMapConsumer } from 'source-map';
// import { OutputChannelLogger } from '../src/Logger';

export async function closeFileIfOpen(file: vscode.Uri) : Promise<void> {
    const tabs: vscode.Tab[] = vscode.window.tabGroups.all.map(tg => tg.tabs).flat();
    const index = tabs.findIndex(tab => tab.input instanceof vscode.TabInputText && tab.input.uri.path === file.path);
    if (index !== -1) {
        await vscode.window.tabGroups.close(tabs[index]);
    }
}

function getSourceMapConsumerSources(sourceMap: SourceMapConsumer) {
    const sources = [];
    sourceMap.eachMapping(item => {
        if (sources.includes(item.source)) {
            return;
        }

        sources.push(item.source);
    });

    return sources;
}

async function testOpenSourceFilesFor(generatedFileWithMap: vscode.Uri) {
    const document = await vscode.workspace.openTextDocument(generatedFileWithMap);
    const outputChannel = vscode.window.createOutputChannel('Source maps');
    const logger = new OutputChannelLogger(outputChannel);
    const sms = new SourceMapStore(logger);
    const mapping = await sms.getForDocument(document);
    const sources = getSourceMapConsumerSources(mapping.sourceMap);

    for (let source of sources) {
        const sourceUri = encodeSourceMapSourceUri(mapping.sourceMapUri, source);

        await assert.doesNotReject(async () => {
            const sourceDocument = await vscode.workspace.openTextDocument(sourceUri);
            const sourceEditor = await vscode.window.showTextDocument(sourceDocument);

            await closeFileIfOpen(sourceUri);
        });
    }

}

suite("SourceMapStore", () => {

    suiteSetup(async () => {
        // wait for activation

        // perhaps, can call activate from here? if it checks the singleton

        // await extensionActivated;
    });
    
    test("flat: Open source files", async () => {
        const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
        const minJsUri = vscode.Uri.joinPath(workspaceUri, "flat/min.js")
        await testOpenSourceFilesFor(minJsUri);
        // assert.equal(workspaceUri.toString(true) + "/flat", mapping.sourceMapBaseUri.toString(true));
    });

    test("flat_no_sourceRoot: Open source files", async () => {
        const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
        const minJsUri = vscode.Uri.joinPath(workspaceUri, "flat_no_sourceRoot/min.js")
        await testOpenSourceFilesFor(minJsUri);
        // assert.equal(workspaceUri.toString(true) + "/flat", mapping.sourceMapBaseUri.toString(true));
    });

    test("with_src_out: Open source files", async () => {
        const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
        const minJsUri = vscode.Uri.joinPath(workspaceUri, "with_src_out/out/min.js")
        await testOpenSourceFilesFor(minJsUri);
        // assert.equal(workspaceUri.toString(true) + "/flat", mapping.sourceMapBaseUri.toString(true));
    });

    test("with_src_out_no_sourceRoot: Open source files", async () => {
        const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
        const minJsUri = vscode.Uri.joinPath(workspaceUri, "with_src_out_no_sourceRoot/out/min.js")
        await testOpenSourceFilesFor(minJsUri);
    });

    test("inline: Open source files", async () => {
        const workspaceUri = vscode.workspace.workspaceFolders[0].uri;
        const minJsUri = vscode.Uri.joinPath(workspaceUri, "inline/min.js")
        await testOpenSourceFilesFor(minJsUri);
    });

    test("flat via http", async () => {
        const httpRootUri = vscode.workspace.workspaceFolders[0].uri;
        const server = await createServer("localhost", 8809, httpRootUri.fsPath);

        const minJsUri = vscode.Uri.parse("sourcemap-http://localhost:8809/flat/min.js");
        // const minJsUri = encodeSourceMapSourceUri(vscode.Uri.parse("null:null"), vscode.Uri.parse("http://localhost:8809/flat/min.js"));
        await testOpenSourceFilesFor(minJsUri);

        await stopServer(server);
    });

    test("flat_no_sourceRoot via http", async () => {
        const httpRootUri = vscode.workspace.workspaceFolders[0].uri;
        const server = await createServer("localhost", 8809, httpRootUri.fsPath);

        const minJsUri = vscode.Uri.parse("sourcemap-http://localhost:8809/flat_no_sourceRoot/min.js");
        // const minJsUri = encodeSourceMapSourceUri(vscode.Uri.parse("null:null"), vscode.Uri.parse("http://localhost:8809/flat_no_sourceRoot/min.js"));
        await testOpenSourceFilesFor(minJsUri);

        await stopServer(server);
    });

    test("remote via http", async () => {
        const httpRootUri = vscode.workspace.workspaceFolders[0].uri;
        const server = await createServer("localhost", 8809, httpRootUri.fsPath);

        const minJsUri = vscode.Uri.parse("sourcemap-http://localhost:8809/remote/min.js");
        // const minJsUri = encodeSourceMapSourceUri(vscode.Uri.parse("null:null"), vscode.Uri.parse("http://localhost:8809/remote/min.js"));
        await testOpenSourceFilesFor(minJsUri);

        await stopServer(server);
    });

});
