import * as vscode from 'vscode';
import { SourceMapConsumer } from 'source-map';
import { SourceMapStore } from './SourceMapStore';
import { ILogger } from './Logger';
import { getSourceUriWithFallback } from './UriHelper';

export class NavigateCodeActionProvider implements vscode.CodeActionProvider {

    constructor(private sourceMapStore: SourceMapStore, private logger: ILogger) {
    }

    // public static readonly providedCodeActionKinds = [
    //     vscode.CodeActionKind.QuickFix,
    // ];

    public async provideCodeActions(document: vscode.TextDocument, range: vscode.Range): Promise<vscode.CodeAction[] | undefined> {
        const mapping = await this.sourceMapStore.getForDocumentNoThrow(document);
        if (!mapping) {
            this.logger.warn(document.uri.toString(true) + ": No mapping for code actions");
            return [];
        }

        const originalPosition = mapping.sourceMap.originalPositionFor({line: range.start.line + 1, column: range.start.character, bias: SourceMapConsumer.LEAST_UPPER_BOUND})
        if (!originalPosition) {
            this.logger.warn(document.fileName + " has sourcemap, but cannot find original position for " + range.start.line + ":" + range.start.character);
            return;
        }

        const sourceUri = await getSourceUriWithFallback(originalPosition.source, mapping.sourceMapUri, mapping.sourceMapBaseUri);
        const action = new vscode.CodeAction('Sourcemap: Go to original source', vscode.CodeActionKind.Empty);
        const sourceUriWithPosition = sourceUri.with({fragment: "L" + originalPosition.line + "," + originalPosition.column});
        action.command = { command: "vscode.open", arguments: [ sourceUriWithPosition ], title: 'Go to original source', tooltip: 'Go to original source via source map.' };

        return [
            action
        ];
    }
}
