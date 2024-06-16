'use strict';
import * as vscode from 'vscode';
import { SourceMapStore } from './SourceMapStore';
import { SourceMapLinkProvider } from './SourceMapLinkProvider';
import { SourceMapContentProvider } from './SourceMapContentProvider';
import { NavigateCodeActionProvider } from './NavigateCodeActionProvider';
import { SourceMapHoverProvider } from './SourceMapHoverProvider';
import { SourceMapItem } from './SourceMapItem';
import { SourceMapSourceContentProvider } from './SourceMapSourceContentProvider';
import { FetchContentProvider } from './FetchContentProvider';
import { ILogger, OutputChannelLogger } from './Logger';
import { getSourceUriWithFallback } from './UriHelper';

class SourceMapExtension {
    sourceMapStore: SourceMapStore;
    logger: ILogger;
    enableHover: boolean;
    enableHttp: boolean;

    constructor(public context: vscode.ExtensionContext) {
        const outputChannel = vscode.window.createOutputChannel('Source maps');
        this.logger = new OutputChannelLogger(outputChannel);
        this.sourceMapStore = new SourceMapStore(this.logger);

        const languages = [
            "javascript",
            "typescript"
        ];
    
        context.subscriptions.push(
            this.sourceMapStore,
            vscode.commands.registerCommand('sourcemap-helper.navigate', () => this.navigate()),
            vscode.languages.registerHoverProvider(languages, new SourceMapHoverProvider(this.sourceMapStore, this.logger)),
            vscode.languages.registerDocumentLinkProvider(languages, new SourceMapLinkProvider(this.sourceMapStore)),
            vscode.workspace.registerTextDocumentContentProvider('sourcemap', new SourceMapContentProvider(this.logger)),
            vscode.workspace.registerTextDocumentContentProvider('sourcemap-source', new SourceMapSourceContentProvider(this.sourceMapStore, this.logger)),
            vscode.workspace.registerTextDocumentContentProvider('sourcemap-http', new FetchContentProvider(this.logger)),
            vscode.workspace.registerTextDocumentContentProvider('sourcemap-https', new FetchContentProvider(this.logger)),
            vscode.languages.registerCodeActionsProvider(languages, new NavigateCodeActionProvider(this.sourceMapStore, this.logger), {
                providedCodeActionKinds: [ vscode.CodeActionKind.QuickFix ]}),
        );
    }

    async navigate() {
        const activeDocument = vscode.window.activeTextEditor.document;

        let mapping: SourceMapItem;
        try {
            mapping = await this.sourceMapStore.getForDocument(activeDocument);
        } catch (err) {
            // TODO; want own Error type so can re-throw other errors
            vscode.window.showWarningMessage("Sourcemap Helper: " + err.message); // Unable to load specified sourceMappingURL: " + link.target.toString());
            return;
        }

        const editorPosition = vscode.window.activeTextEditor.selection.active;
        const originalPosition = mapping.sourceMap.originalPositionFor({ line: editorPosition.line + 1, column: editorPosition.character });

        if (!originalPosition || originalPosition.source === null) {
            vscode.window.showWarningMessage("Sourcemap Helper: Found sourcemap, but no mapping defined at " + (editorPosition.line + 1) + ":" + editorPosition.character);
            return;
        }

        const destinationPosition = new vscode.Position(originalPosition.line - 1, originalPosition.column);
        const sourceUri = await getSourceUriWithFallback(originalPosition.source, mapping.sourceMapUri, mapping.sourceMapBaseUri);

        try {
            const sourceDocument = await vscode.workspace.openTextDocument(sourceUri);
            const editor = await vscode.window.showTextDocument(sourceDocument);
            editor.selection = new vscode.Selection(destinationPosition, destinationPosition);
            editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
        } catch (err: any) {
            vscode.window.showWarningMessage(`Can\'t get source map for current document: ${err.message}`);
            this.logger.error(err);
        }
    }
};

export function activate(context: vscode.ExtensionContext) {
    let singleton: SourceMapExtension = null;

    console.log("Sourcemap Helper extension activating")
    singleton = new SourceMapExtension(context);
}
