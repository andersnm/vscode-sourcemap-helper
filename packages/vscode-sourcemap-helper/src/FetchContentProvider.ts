import * as vscode from 'vscode';
import { SourceMapStore } from './SourceMapStore';
import { SourceMapSettings } from './SourceMapSettings';
import { ILogger } from './Logger';

/**
 * Provides a read-only TextDocument for http/https URLs. Like sourcemap urls or sourcemap source urls.
 */
export class FetchContentProvider implements vscode.TextDocumentContentProvider {

  constructor(private logger: ILogger) {

  }

  public async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> {
    if (!SourceMapSettings.enableHttp) {
      throw new Error("Sourcemap Helper: Remote download is disabled from Settings");
    }

    this.logger.info("Fetching " + uri.toString(true));

    const sp = uri.scheme.indexOf("sourcemap-");
    if (sp === -1) {
      return "Cannot parse URI " + uri.toString(false);
    }

    uri = uri.with({
      scheme: uri.scheme.substring(10),
    });

    const result = await fetch(uri.toString(false));
    return await result.text();
  }
}
