import * as vscode from 'vscode';
import { SourceMapStore } from './SourceMapStore';

export class SourceMapLinkProvider implements vscode.DocumentLinkProvider {
    constructor(private sourceMapStore: SourceMapStore) {
    }

    public async provideDocumentLinks(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.DocumentLink[]> {
        const link = await this.sourceMapStore.findSourceMapLink(document);
        if (!link) {
            return [];
        }

        return [link];
    }
}
