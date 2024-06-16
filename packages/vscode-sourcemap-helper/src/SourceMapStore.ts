import * as vscode from 'vscode';
import { SourceMapItem } from './SourceMapItem';
import { decodeSourceMapSourceUri, dirUri, fileExists, getSourceMapUriBaseUri, getSourceUri, transformSourceMapDataUri, transformSourceMapHttpUri } from './UriHelper';
import { ILogger } from './Logger';

const SOURCE_MAPPING_MATCHER = /^(\/\/[#@] ?sourceMappingURL\s*=\s*)(.+)$/;

export class SourceMapStore implements vscode.Disposable {
    private uriToSourceMapCache: {[generatedUri: string]: SourceMapItem} = {};
    private watchers: {[path: string]: vscode.FileSystemWatcher} = {};

    constructor(private logger: ILogger) {
    }

    public cacheMapping(uri: vscode.Uri, mapping: SourceMapItem): string| null {
        const key = uri.toString(true);

        this.uriToSourceMapCache[key] = mapping;

        if (uri.scheme === "file") {
            try {
                const watcher = vscode.workspace.createFileSystemWatcher(key, true);
                watcher.onDidChange(() => this.uncacheMapping(key));
                watcher.onDidDelete(() => this.uncacheMapping(key));
                this.watchers[key] = watcher;
                return key;
            } catch (err) {
                this.logger.error(uri.toString(true) + ": " + err.message);
            }
        } else {
            // TODO; fix leak, set timeouts to clear from cache
        }

        return null;
    }

    private uncacheMapping(key: string): void {
        if (this.watchers[key]) {
            this.watchers[key].dispose();
            delete this.watchers[key];
        }

        delete this.uriToSourceMapCache[key];
    }

    public dispose() {
        for (let key of Object.keys(this.watchers)) {
            this.uncacheMapping(key);
        }

        this.watchers = {};
        this.uriToSourceMapCache = {};

    }

    /**
     * Load a sourcemap from a uri and and cache it. 'file:' scheme uris will be watched and removed from the cache upon delete or change.
     */
    async loadSourceMap(sourceMapUri: vscode.Uri) {
        const sourceMapKey = sourceMapUri.toString(true);

        let mapping = this.uriToSourceMapCache[sourceMapKey];
        if (mapping) {
            return mapping;
        }

        // This loads http/inline sourcemap via SourceMapContentProvider
        const sourceMapDocument = await vscode.workspace.openTextDocument(sourceMapUri);
        const sourceMapBaseDir = getSourceMapUriBaseUri(sourceMapUri);

        mapping = await SourceMapItem.fromString(sourceMapDocument.getText(), sourceMapUri, sourceMapBaseDir)
        this.cacheMapping(sourceMapUri, mapping);

        return mapping;
    }

    /**
     * Returns the source map for a generated file or null.
     */
    public async getForDocumentNoThrow(document: vscode.TextDocument): Promise<SourceMapItem|null> {
        try {
            return await this.getForDocument(document);
        } catch (err) {
            this.logger.error(document.uri.toString(true) + ": " + err.message)
            return null;
        }
    }

    /**
     * Returns the source map for a generated file, or throws a detailed exception if no valid sourcemap was found.
     */
    public async getForDocument(document: vscode.TextDocument): Promise<SourceMapItem> {
        const documentUri = document.uri;
        const documentKey = documentUri.toString(true);

        const result = this.uriToSourceMapCache[documentKey];
        if (result) {
            return result;
        }

        const link = await this.findSourceMapLink(document);
        let sourceMapUri: vscode.Uri;

        if (!link) {
            // If there there is no explicit link, can still check file system if a corresponding .map exists
            if (documentUri.scheme === "file" && await fileExists(documentUri.fsPath + ".map")) {
                sourceMapUri = vscode.Uri.file(documentUri.fsPath + ".map")
            } else {
                // no sourceMappingURI nor .map file with same name as source, give up
                throw new Error(documentUri.toString(true) + ": No sourceMappingURL nor .map file with same name as source");
            }
        } else {
            sourceMapUri = link.target;
        }

        try {
            const mapping = await this.loadSourceMap(sourceMapUri);

            this.cacheMapping(documentUri, mapping);

            return mapping;
        } catch (err) {
            throw new Error(documentUri.toString(true) + ": Cannot load sourcemap from URI " + sourceMapUri.toString(true) + ": " + err.message);
        }
    }


    /**
     * Scans the last 10 lines of a document for the sourceMappingURL magic string and returns the sourcemap uri and document position.
     */
    async findSourceMapLink(document: vscode.TextDocument/*, overrideUri?: vscode.Uri*/): Promise<vscode.DocumentLink|null> {

        let documentBaseUri: vscode.Uri;
    
        if (document.uri.scheme === "sourcemap-source") {
            const { sourceMapUri, source } = decodeSourceMapSourceUri(document.uri);
            const mapping = await this.loadSourceMap(sourceMapUri);
            const sourceUri = getSourceUri(source, mapping.sourceMapBaseUri);
    
            documentBaseUri = dirUri(sourceUri);
        } else {
            documentBaseUri = dirUri(document.uri);
        }
    
        for (let l = document.lineCount - 1; l >= Math.max(document.lineCount - 10, 0); l--) {
            // only search for url in the last 10 lines
            const line = document.lineAt(l);
            const matches = SOURCE_MAPPING_MATCHER.exec(line.text);
    
            if (matches && matches.length === 3) {
                const link = matches[2].trim();
                const start = new vscode.Position(line.lineNumber, matches[1].length);
                const end = start.translate(0, link.length);
    
                // Support URIs with file, data schemes, plus relative paths (not uri)
                // https://datatracker.ietf.org/doc/html/rfc3986
                //  scheme  = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
                // accept uppercase letters as equivalent to lowercase in scheme names, produce lowercase scheme names for consistency
                // Taking the liberty to require scheme names have 2+ letters (regex '+' instead of '*') and assume 1-letter "scheme" is a windows absolute path; accept windows paths w/slash
                const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9\+\-\.]+\:/;
                const WIN_ABS_REGEX = /^[a-zA-Z]\:[\\\/]/;
                const ABS_REGEX = /^[\\\/]/;
    
                let isUriScheme = SCHEME_REGEX.test(link);
                let isAbsoluteWindowsPath = WIN_ABS_REGEX.test(link);
                let isAbsolutePath = ABS_REGEX.test(link);
    
                let uri: vscode.Uri;
                if (isUriScheme) {
                    uri = transformSourceMapHttpUri(vscode.Uri.parse(link));
                    uri = transformSourceMapDataUri(uri, documentBaseUri);
                } else if (isAbsoluteWindowsPath || isAbsolutePath) {
                    uri = vscode.Uri.file(link);
                } else {
                    uri = vscode.Uri.joinPath(documentBaseUri, link)
                }
    
                return new vscode.DocumentLink(new vscode.Range(start, end), uri);
            }
        }
    
        return null;
    }
}
