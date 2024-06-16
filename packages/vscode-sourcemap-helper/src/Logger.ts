import * as vscode from 'vscode';
import { SourceMapSettings } from './SourceMapSettings';

export type LogLevelType = "error" | "info" | "debug";

export interface ILogger {
    info(text: string): void;
    error(text: string): void;
    warn(text: string): void;
    debug(text: string): void;
}

function checkLevel(current: LogLevelType) {
    switch (SourceMapSettings.debugLevel) {
        case "debug":
            return true;
        case "info":
            switch (current) {
                case "info":
                case "error":
                    return true;
            }
        case "error":
            switch (current) {
                case "error":
                    return true;
            }
    }

    return false;
}

export class OutputChannelLogger implements ILogger {
    constructor(private outputChannel: vscode.OutputChannel) {
    }

    info(text: string): void {
        if (checkLevel("info")) this.outputChannel.appendLine("[INFO] " + text)
    }

    error(text: string): void {
        if (checkLevel("error")) this.outputChannel.appendLine("[ERROR] " + text)
    }

    warn(text: string): void {
        if (checkLevel("error")) this.outputChannel.appendLine("[WARN] " + text)
    }

    debug(text: string): void {
        if (checkLevel("debug")) this.outputChannel.appendLine("[DEBUG] " + text)
    }
}
