import * as vscode from 'vscode';
import { SourceMapStore } from './SourceMapStore';
import { decodeSourceMapSourceUri, getSourceUri } from './UriHelper';
import { ILogger } from './Logger';

/**
 * Provides a read-only TextDocument for a source referenced in a sourcemap. It falls back to the sourcemap's sourcesContent if the source fails to load
 */
export class SourceMapSourceContentProvider implements vscode.TextDocumentContentProvider {

  constructor(private sourceMapStore: SourceMapStore, private logger: ILogger) {
  }

  public async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> {
    // sourcemap-source:path?sm=sourceMapUri&s=source
    this.logger.info(uri.toString(true) + ": Loading");

    const { sourceMapUri, source, path } = decodeSourceMapSourceUri(uri);

    const mapping = await this.sourceMapStore.loadSourceMap(sourceMapUri);
    const sourceUri = getSourceUri(source, mapping.sourceMapBaseUri);

    try {
      const doc = await vscode.workspace.openTextDocument(sourceUri);
      const text = doc.getText();
      this.logger.debug(text);
      return text;
    } catch (err) {
      const sourceContent = mapping.sourceMap.sourceContentFor(source) || "";
      if (sourceContent) {
        this.logger.info(uri.toString(true) + ": Not found. Using sourcesContent fallback from sourcemap.");
        return sourceContent;
      }

      this.logger.warn(uri.toString(true) + ": Not found. No sourcesContent fallback in sourcemap.");

      return "/" + "*\nCannot load source code referenced by the sourcemap.\n\nSourcemap: " + sourceMapUri.toString(true) + "\nSourcemap relative URI: " + mapping.sourceMapBaseUri + "\nSource: " + source + "\nSource URI: " + sourceUri.toString(true) + "\nInternal URI: " + uri.toString(true) + "\n\nError:\n" + err.message + "\n*" + "/";
    }
  }
}
