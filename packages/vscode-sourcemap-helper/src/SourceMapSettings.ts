'use strict';

import * as vscode from 'vscode';
import { LogLevelType } from './Logger';

export class SourceMapSettings {
    static get enableHover(): boolean {
        const settings = vscode.workspace.getConfiguration();
        return settings.get<boolean>("sourcemapHelper.hover.enable");
    }

    static get hoverLines(): number {
        const settings = vscode.workspace.getConfiguration();
        return settings.get<number>("sourcemapHelper.hover.lines");
    }

    static get enableHttp(): boolean {
        const settings = vscode.workspace.getConfiguration();
        return settings.get<boolean>("sourcemapHelper.http.enable");
    }

    static get debugLevel(): LogLevelType {
        const settings = vscode.workspace.getConfiguration();
        return settings.get<LogLevelType>("sourcemapHelper.debug.level");
    }
}
