import * as vscode from 'vscode';
import * as path from 'path';
import { SourceMapStore } from './SourceMapStore';
import { SourceMapSettings } from './SourceMapSettings';
import { getSourceUriWithFallback } from './UriHelper';
import { ILogger } from './Logger';

export class SourceMapHoverProvider implements vscode.HoverProvider {
    constructor(private sourceMapStore: SourceMapStore, private logger: ILogger) {
    }

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover> {
        if (!SourceMapSettings.enableHover) {
            this.logger.debug(document.uri.toString(true) + ": No sourcemap hover, disabled")
            return;
        }

        const mapping = await this.sourceMapStore.getForDocumentNoThrow(document);
        if (!mapping) {
            this.logger.debug(document.uri.toString(true) + ": No sourcemap hover, no sourcemap")
            return;
        }

        const originalPosition = mapping.sourceMap.originalPositionFor({line: position.line + 1, column: position.character})
        if (!originalPosition || !originalPosition.source) {
            this.logger.debug(document.uri.toString(true) + ": No sourcemap hover, has sourcemap but no mapping")
            return;
        }

        const sourceUri = await getSourceUriWithFallback(originalPosition.source, mapping.sourceMapUri, mapping.sourceMapBaseUri);

        try {
            const fileDocument = await vscode.workspace.openTextDocument(sourceUri);

            const hoverLines = SourceMapSettings.hoverLines;

            const fromLine = Math.max(1, originalPosition.line - hoverLines);
            const toLine = Math.min(fileDocument.lineCount, originalPosition.line + hoverLines);

            const slice = fileDocument.getText(new vscode.Range(new vscode.Position(fromLine - 1, 0), new vscode.Position(toLine - 1, 0)));

            const markdown = new vscode.MarkdownString();//"Original code**");
            markdown.isTrusted = true;
            // markdown.supportHtml = true; // try to bold the middle line
            markdown.appendCodeblock(slice, fileDocument.languageId);

            const linkLabel = path.basename(sourceUri.path);
            
        	// return uri.with({ fragment: `${selection.startLineNumber},${selection.startColumn}${selection.endLineNumber ? `-${selection.endLineNumber}${selection.endColumn ? `,${selection.endColumn}` : ''}` : ''}` });
            // https://github.com/microsoft/vscode/blob/b3ec8181fc49f5462b5128f38e0723ae85e295c2/src/vs/platform/opener/common/opener.ts#L147
	
            const args = encodeURIComponent(JSON.stringify([ sourceUri.with({fragment: "L" + originalPosition.line + "," + originalPosition.column}) ]));
            markdown.appendMarkdown("[Open " + linkLabel + "](command:vscode.open?" + args + ")");

            return new vscode.Hover(markdown, new vscode.Range(position, position));
        } catch (err: any) {
            this.logger.error(document.uri.toString(true) + ": " + err.message);
            return new vscode.Hover({
                language: "text",
                value: "Sourcemap Helper: " + err.message
            });
        }
    }
}
