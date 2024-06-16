import * as vscode from 'vscode';
import { SourceMapConsumer, RawSourceMap } from 'source-map';

export class SourceMapItem {
    /**
     * @param rawSourceMap The raw JSON sourcemap object.
     * @param sourceMap The parsed SourceMapConsumer object returned from the "source-map" package.
     * @param sourceMapUri The full URI to the sourcemap. Can be used for cache key.
     * @param sourceMapBaseUri Relative base URI for resources referenced in the sourcemap. Usually the containing directory of the sourcemap file, or the containing directory of the generated source file for inline sourcemaps.
     */
    constructor(public rawSourceMap: RawSourceMap, public sourceMap: SourceMapConsumer, public sourceMapUri: vscode.Uri, public sourceMapBaseUri: vscode.Uri){
    }

    static async fromString(data: string, sourceMapUri: vscode.Uri, sourceMapBaseUri: vscode.Uri): Promise<SourceMapItem> {
        const rawSourceMap = JSON.parse(data) as RawSourceMap;
        const sourceMap = await new SourceMapConsumer(rawSourceMap);
        return new SourceMapItem(rawSourceMap, sourceMap, sourceMapUri, sourceMapBaseUri);
    }

    // getSourceUri(source: string): vscode.Uri {
    //     return hasUriScheme(source)
    //         ? transformSourceMapHttpUri(vscode.Uri.parse(source))
    //         : vscode.Uri.joinPath(this.sourceMapBaseUri, source);
    // }

    // /**
    //  * 
    //  * @param source The 'source' property returned from the SourceMapConsumer - *not* the RawSourceMap - these are not interchangeable
    //  * @returns Preferably a file Uri, otherwise an indirect sourcemap-source Uri which falls back to sourcesContent from the source map
    //  */
    // async getSourceUriWithFallback(source: string): Promise<vscode.Uri> {
    
    //     // Try to resolve the actual source uri, because if it's a file-uri, want to open the exact local file
    //     const realSourceUri = this.getSourceUri(source);
    
    //     if (realSourceUri.scheme === "file" && await fileExists(realSourceUri.fsPath)) {
    //         // if the sourceUri leads to a file, and the file exists, open the file-link, rather than a read-only copy via the sourcemap
    //         return realSourceUri;
    //     } else {
    //         // This is an indirect link loading the source via the sourcemap-source scheme via SourceMapSourceContentProvider
    //         const sourceUri = encodeSourceMapSourceUri(this.sourceMapUri, source);
    //         return sourceUri;
    //     }
    // }
}
