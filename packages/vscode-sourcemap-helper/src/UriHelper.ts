import * as path from 'path';
import * as vscode from 'vscode';
import * as querystring from 'querystring'; 
import { stat } from 'fs/promises';

const SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9\+\-\.]+\:/;

export function hasUriScheme(uriOrPath: string) {
    return SCHEME_REGEX.test(uriOrPath);
}

/**
 * If the input uri is 'http:' or 'https:' scheme, then transforms to and returns an internal 'sourcemap-http:' or 'sourcemap-https:' uri.
 */
export function transformSourceMapHttpUri(uri: vscode.Uri): vscode.Uri {
    if (uri.scheme === "http" || uri.scheme === "https") {
        return uri.with({
            scheme: 'sourcemap-' + uri.scheme,
        });
    }

    return uri;
}

/**
 * If the input uri is 'data:' scheme, then transforms to and returns an internal 'sourcemap:' uri which includes the baseUri.
 */
export function transformSourceMapDataUri(uri: vscode.Uri, documentBaseUri: vscode.Uri): vscode.Uri {
    if (uri.scheme === "data") {
        return uri.with({
            scheme: 'sourcemap', // + uri.scheme,
            fragment: documentBaseUri.toString(true),
        });
    }

    return uri;
}

export function getSourceMapUriBaseUri(sourceMapUri: vscode.Uri): vscode.Uri {
    // Resolve baseDirUri from inline 'sourcemap:' URI
    if (sourceMapUri.scheme === "sourcemap") {
        // sourcemap:data#baseDirUri
        return vscode.Uri.parse(sourceMapUri.fragment);
    } else {
        // Otherwise trim the sourcemap filename part off the Uri's path
        return dirUri(sourceMapUri);
    }
}

/**
 * Encodes a Uri like `sourcemap-source:path?sm=sourceMapUri&s=source`
 * @param sourceMapUri A Uri that references a sourcemap. 
 * @param source A SourceMapConsumer 'source' (NOTE; not interchangeable with RawSourceMap 'sources'/'sourcesContent')
 * @returns A 'sourcemap-source:' uri
 */
export function encodeSourceMapSourceUri(sourceMapUri: vscode.Uri, source: string): vscode.Uri {
    // TODO; more like this;
    // const args = encodeURIComponent(JSON.stringify([ sourceUri.with({fragment: "L" + originalPosition.line}) ]));
    // markdown.appendMarkdown("[" + linkLabel + "](command:vscode.open?" + args + ")");

    const query = querystring.encode({
        sm: sourceMapUri.toString(true),
        s: source,
    });

    // Extract path component from source if uri - its just for the vscode title
    const isUriScheme = SCHEME_REGEX.test(source);
    let path: string;
    if (isUriScheme) {
        path = vscode.Uri.parse(source).path;
    } else {
        path = source;
    }

    return vscode.Uri.from({
        scheme: 'sourcemap-source',
        path,
        query,
    });
}

/**
 * Decodes a Uri like `sourcemap-source:path?sm=sourceMapUri&s=source`
 * @param uri 
 * @returns `{ sourceMapUri, source, path }`
 */
export function decodeSourceMapSourceUri(uri: vscode.Uri) {
    const query = querystring.parse(uri.query);

    const sourceMapUri = vscode.Uri.parse(query.sm as string);
    const source = query.s as string;
    const path = uri.path;

    return {sourceMapUri, source, path};
}

/**
 * Resolves the uri for a sourcemap source file. Translates `http:`, `https:` scehemes to `sourcemap-http:`, `sourcemap-https:` schemes.
 * @param source The 'source' property returned from the SourceMapConsumer - *not* the RawSourceMap - these are not interchangeable.
 * @param sourceMapBaseUri The base uri for relative source paths.
 * @returns Full uri to the source file.
 */
export function getSourceUri(source: string, sourceMapBaseUri: vscode.Uri): vscode.Uri {
    return hasUriScheme(source)
        ? transformSourceMapHttpUri(vscode.Uri.parse(source))
        : vscode.Uri.joinPath(sourceMapBaseUri, source);
}

/**
 * Resolves the uri for a sourcemap source file, returns a 'file' scheme uri if possible, otherwise encodes as a 'sourcemap-source' scheme.
 * @param source The 'source' property returned from the SourceMapConsumer - *not* the RawSourceMap - these are not interchangeable.
 * @param sourceMapUri The uri of the sourcemap.
 * @param sourceMapBaseUri The base uri for relative source paths.
 * @returns Preferably a file Uri, otherwise an indirect sourcemap-source Uri which falls back to sourcesContent from the source map.
 */
export async function getSourceUriWithFallback(source: string, sourceMapUri: vscode.Uri, sourceMapBaseUri: vscode.Uri): Promise<vscode.Uri> {

    // Try to resolve the actual source uri, because if it's a file-uri, want to open the exact local file
    const realSourceUri = getSourceUri(source, sourceMapBaseUri);

    if (realSourceUri.scheme === "file" && await fileExists(realSourceUri.fsPath)) {
        // if the sourceUri leads to a file, and the file exists, open the file-link, rather than a read-only copy via the sourcemap
        return realSourceUri;
    } else {
        // This is an indirect link loading the source via the sourcemap-source scheme via SourceMapSourceContentProvider
        return encodeSourceMapSourceUri(sourceMapUri, source);
    }
}

export async function fileExists(fsPath: string): Promise<boolean> {
    try {
        await stat(fsPath);
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Removes the filename part of the uri path using `path.dirname()`.
 * @param uri The uri
 * @returns A url with it's path component trimmed by `path.dirname()`.
 */
export function dirUri(uri: vscode.Uri): vscode.Uri {
    return uri.with({path: path.dirname(uri.path) });
}
