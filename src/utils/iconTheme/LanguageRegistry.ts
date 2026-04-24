/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';

/**
 * Builds and caches a filename / file-extension → VS Code language ID map by scanning
 * every extension's `contributes.languages`. Built-in languages (typescript, json, etc.)
 * are contributed by built-in extensions and are therefore included.
 *
 * Required because VS Code doesn't expose a public "what language is this filename?" API,
 * but many popular file-icon themes (notably Material Icon Theme) map the majority of their
 * icons via `languageIds`, not `fileExtensions`.
 */
export class LanguageRegistry {
    private _extensionToId: Map<string, string> | undefined;
    private _filenameToId: Map<string, string> | undefined;

    invalidate(): void {
        this._extensionToId = undefined;
        this._filenameToId = undefined;
    }

    /** Resolve a filename (e.g. "App.tsx", "tsconfig.json") to a VS Code language ID, if one is registered. */
    getLanguageId(filename: string): string | undefined {
        this._build();
        const lower = filename.toLowerCase();

        // Exact filename match first (e.g. "Dockerfile", "tsconfig.json")
        const byName = this._filenameToId!.get(lower);
        if (byName) {
            return byName;
        }

        // Longest matching extension suffix, consistent with how VS Code resolves languages
        // (e.g. "foo.test.ts" → try "test.ts" then "ts").
        const segments = lower.split('.');
        for (let i = 1; i < segments.length; i++) {
            const ext = '.' + segments.slice(i).join('.');
            const byExt = this._extensionToId!.get(ext);
            if (byExt) {
                return byExt;
            }
        }
        return undefined;
    }

    private _build(): void {
        if (this._extensionToId && this._filenameToId) {
            return;
        }
        const extMap = new Map<string, string>();
        const nameMap = new Map<string, string>();

        for (const ext of vscode.extensions.all) {
            const langs = (ext.packageJSON?.contributes as { languages?: Array<LanguageContribution> } | undefined)?.languages;
            if (!langs) {
                continue;
            }
            for (const lang of langs) {
                if (!lang.id) {
                    continue;
                }
                for (const e of lang.extensions ?? []) {
                    // Normalize to ".ts"
                    const key = (e.startsWith('.') ? e : '.' + e).toLowerCase();
                    // First contributor wins to mirror VS Code's resolution order.
                    if (!extMap.has(key)) {
                        extMap.set(key, lang.id);
                    }
                }
                for (const f of lang.filenames ?? []) {
                    const key = f.toLowerCase();
                    if (!nameMap.has(key)) {
                        nameMap.set(key, lang.id);
                    }
                }
            }
        }

        this._extensionToId = extMap;
        this._filenameToId = nameMap;
    }
}

interface LanguageContribution {
    id?: string;
    extensions?: string[];
    filenames?: string[];
}
