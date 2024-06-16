import * as vscode from 'vscode';
import { SourceMapStore } from './SourceMapStore';
import { ILogger } from './Logger';

/**
 * Provides a read-only TextDocument for inline sourcemaps.
 * SourceMapLinkProvider creates links using the "sourcemap"-scheme for inline sourceMappingURL plus the sourceMapBaseUri
 */
export class SourceMapContentProvider implements vscode.TextDocumentContentProvider {
  constructor(private logger: ILogger) {
  }

  public async provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): Promise<string> {
    // sourcemap:data-string#baseDir
    this.logger.debug(uri.toString(true) + ": Reading inline sourcemap");

    if (uri.scheme === "sourcemap") {
      if (!uri.path.includes(',')) {
          throw new Error('Provided uri is not a valid data URI');
      }

      // Don't bother about reading encoding and mime type - they are
      // always utf-8 and 'application/json' (according to the spec)
      const data = uri.path.split(',', 2)[1];
      return Buffer.from(data, 'base64').toString('utf8');
    } else {
      // dont know this scheme
      throw new Error("Sourcemap Helper: Expected inline 'sourcemap:' scheme. " + uri.toString(true));
    }
  }
}
