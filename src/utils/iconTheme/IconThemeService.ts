/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { LanguageRegistry } from './LanguageRegistry';
import {
    type IconDefinition,
    type IconFont,
    type IconFontFace,
    type IconRequest,
    type IconThemeDocument,
    type IconThemeOverrides,
    type IconThemePayload,
    type ResolvedIcon,
    makeIconKey,
} from './types';

interface LoadedTheme {
    themeId: string;
    extensionUri: vscode.Uri;
    jsonUri: vscode.Uri;
    /** Folder containing the theme JSON. All paths in the JSON are relative to this. */
    baseUri: vscode.Uri;
    document: IconThemeDocument;
}

/**
 * Resolves the currently-active VS Code file-icon theme's icons for a given set of
 * filenames / folder names, so a webview can render icons that match the user's Explorer.
 *
 * The service:
 *  - discovers the contributing extension by reading its `package.json#contributes.iconThemes`
 *  - loads and caches the theme JSON
 *  - emits `onDidChange` when the active theme, color theme, or theme JSON file changes
 *
 * Callers construct a payload with `buildPayload()`, which:
 *  - applies color-theme-kind overrides (`light`, `highContrast`, `highContrastLight`)
 *  - turns icon paths into webview URIs via `asWebviewUri`
 *  - returns `@font-face` declarations for font-based themes (e.g. Seti)
 *
 * Returns `null` `themeId` when the user has disabled file icons (`workbench.iconTheme: null`);
 * callers should fall back to codicons in that case.
 */
export class IconThemeService implements vscode.Disposable {
    private readonly _onDidChange = new vscode.EventEmitter<void>();
    readonly onDidChange: vscode.Event<void> = this._onDidChange.event;

    private readonly _disposables: vscode.Disposable[] = [];
    private readonly _languageRegistry = new LanguageRegistry();
    private _currentTheme: LoadedTheme | null | undefined;
    private _themeFileWatcher: vscode.FileSystemWatcher | undefined;

    constructor() {
        this._disposables.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (e.affectsConfiguration('workbench.iconTheme')) {
                    this._invalidate();
                }
            }),
            vscode.extensions.onDidChange(() => {
                this._languageRegistry.invalidate();
                this._invalidate();
            }),
            vscode.window.onDidChangeActiveColorTheme(() => this._onDidChange.fire()),
            this._onDidChange,
        );
    }

    dispose(): void {
        this._themeFileWatcher?.dispose();
        for (const d of this._disposables) {
            d.dispose();
        }
    }

    /** Extension folder of the active icon theme extension, or undefined if none. Ensures the theme has been loaded. */
    async ensureThemeExtensionUri(): Promise<vscode.Uri | undefined> {
        const theme = await this._ensureLoaded();
        return theme?.extensionUri;
    }

    /**
     * Load the active icon theme (if not already) and return an IconThemePayload
     * with resolutions for every requested node.
     */
    async buildPayload(requests: IconRequest[], webview: vscode.Webview): Promise<IconThemePayload> {
        const theme = await this._ensureLoaded();
        if (!theme) {
            return { themeId: null, fontFaces: [], icons: {}, defaults: {} };
        }

        const kind = vscode.window.activeColorTheme.kind;
        const merged = mergeOverrides(theme.document, kind);

        const fontFaces = buildFontFaces(theme, webview);

        const iconCache = new Map<string, ResolvedIcon | undefined>();
        const resolveDefKey = (defKey: string | undefined) =>
            this._resolveDef(defKey, merged, theme, webview, iconCache);

        const icons: Record<string, ResolvedIcon> = {};
        for (const req of requests) {
            const defKey = pickDefinitionKey(req, merged, this._languageRegistry);
            const resolved = resolveDefKey(defKey);
            if (resolved) {
                icons[makeIconKey(req.name, req.isFolder, req.isOpen)] = resolved;
            }
        }

        return {
            themeId: theme.themeId,
            fontFaces,
            icons,
            defaults: {
                file: resolveDefKey(merged.file),
                folder: resolveDefKey(merged.folder),
                folderExpanded: resolveDefKey(merged.folderExpanded ?? merged.folder),
            },
        };
    }

    private _invalidate(): void {
        this._currentTheme = undefined;
        this._themeFileWatcher?.dispose();
        this._themeFileWatcher = undefined;
        this._onDidChange.fire();
    }

    private async _ensureLoaded(): Promise<LoadedTheme | null> {
        if (this._currentTheme !== undefined) {
            return this._currentTheme;
        }

        const themeId = vscode.workspace.getConfiguration('workbench').get<string | null>('iconTheme');
        if (!themeId) {
            this._currentTheme = null;
            return null;
        }

        const contributor = findContributingExtension(themeId);
        if (!contributor) {
            this._currentTheme = null;
            return null;
        }

        const jsonUri = vscode.Uri.joinPath(contributor.extensionUri, contributor.path);
        let document: IconThemeDocument;
        try {
            const bytes = await vscode.workspace.fs.readFile(jsonUri);
            document = JSON.parse(Buffer.from(bytes).toString('utf8')) as IconThemeDocument;
        } catch {
            this._currentTheme = null;
            return null;
        }

        const baseUri = vscode.Uri.joinPath(jsonUri, '..');
        this._currentTheme = { themeId, extensionUri: contributor.extensionUri, jsonUri, baseUri, document };

        // Watch the theme JSON file so we catch in-theme config changes
        // (e.g. Material regenerates its JSON when the user changes icon packs).
        this._themeFileWatcher?.dispose();
        try {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(baseUri, jsonUri.path.split('/').pop() ?? '*.json'),
            );
            watcher.onDidChange(() => this._invalidate());
            watcher.onDidCreate(() => this._invalidate());
            watcher.onDidDelete(() => this._invalidate());
            this._themeFileWatcher = watcher;
        } catch {
            // FileSystemWatcher may fail for paths outside workspace folders in some environments;
            // that's OK — we still handle `workbench.iconTheme` config changes.
        }

        return this._currentTheme;
    }

    private _resolveDef(
        defKey: string | undefined,
        merged: IconThemeDocument,
        theme: LoadedTheme,
        webview: vscode.Webview,
        cache: Map<string, ResolvedIcon | undefined>,
    ): ResolvedIcon | undefined {
        if (!defKey) {
            return undefined;
        }
        if (cache.has(defKey)) {
            return cache.get(defKey);
        }
        const def = merged.iconDefinitions?.[defKey];
        if (!def) {
            cache.set(defKey, undefined);
            return undefined;
        }
        const resolved = resolveDefinition(def, merged, theme, webview);
        cache.set(defKey, resolved);
        return resolved;
    }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function findContributingExtension(themeId: string): { extensionUri: vscode.Uri; path: string } | undefined {
    for (const ext of vscode.extensions.all) {
        const contributes = ext.packageJSON?.contributes as { iconThemes?: Array<{ id: string; path: string }> } | undefined;
        const match = contributes?.iconThemes?.find(t => t.id === themeId);
        if (match) {
            return { extensionUri: ext.extensionUri, path: match.path };
        }
    }
    return undefined;
}

/** Merge `light` / `highContrast` / `highContrastLight` overrides into the base doc based on the active color theme kind. */
function mergeOverrides(doc: IconThemeDocument, kind: vscode.ColorThemeKind): IconThemeDocument {
    let overrides: IconThemeOverrides | undefined;
    switch (kind) {
        case vscode.ColorThemeKind.Light:
            overrides = doc.light;
            break;
        case vscode.ColorThemeKind.HighContrast:
            overrides = doc.highContrast;
            break;
        case vscode.ColorThemeKind.HighContrastLight:
            overrides = doc.highContrastLight ?? doc.light;
            break;
        default:
            overrides = undefined;
    }
    if (!overrides) {
        return doc;
    }
    // Shallow-merge each map so override entries win but base entries remain.
    return {
        ...doc,
        iconDefinitions: { ...(doc.iconDefinitions ?? {}), ...(overrides.iconDefinitions ?? {}) },
        fileNames: { ...(doc.fileNames ?? {}), ...(overrides.fileNames ?? {}) },
        fileExtensions: { ...(doc.fileExtensions ?? {}), ...(overrides.fileExtensions ?? {}) },
        languageIds: { ...(doc.languageIds ?? {}), ...(overrides.languageIds ?? {}) },
        folderNames: { ...(doc.folderNames ?? {}), ...(overrides.folderNames ?? {}) },
        folderNamesExpanded: { ...(doc.folderNamesExpanded ?? {}), ...(overrides.folderNamesExpanded ?? {}) },
        rootFolderNames: { ...(doc.rootFolderNames ?? {}), ...(overrides.rootFolderNames ?? {}) },
        rootFolderNamesExpanded: { ...(doc.rootFolderNamesExpanded ?? {}), ...(overrides.rootFolderNamesExpanded ?? {}) },
        file: overrides.file ?? doc.file,
        folder: overrides.folder ?? doc.folder,
        folderExpanded: overrides.folderExpanded ?? doc.folderExpanded,
        rootFolder: overrides.rootFolder ?? doc.rootFolder,
        rootFolderExpanded: overrides.rootFolderExpanded ?? doc.rootFolderExpanded,
    };
}

/**
 * Pick the icon-definitions key for a given node, matching VS Code's resolution order.
 *
 *  - Folder (open): folderNamesExpanded → folderNames → rootFolderNamesExpanded → rootFolderNames → folderExpanded → folder
 *  - Folder (closed): folderNames → rootFolderNames → folder
 *  - File: fileNames (exact) → fileExtensions (longest suffix) → languageIds (resolved from filename) → file
 *
 * All name comparisons are case-insensitive (VS Code lowercases keys when building its index).
 */
function pickDefinitionKey(req: IconRequest, doc: IconThemeDocument, languageRegistry: LanguageRegistry): string | undefined {
    const rawName = req.name.endsWith('/') ? req.name.slice(0, -1) : req.name;
    const name = rawName.toLowerCase();

    if (req.isFolder) {
        if (req.isOpen) {
            return lookup(doc.folderNamesExpanded, name)
                ?? lookup(doc.folderNames, name)
                ?? lookup(doc.rootFolderNamesExpanded, name)
                ?? lookup(doc.rootFolderNames, name)
                ?? doc.folderExpanded
                ?? doc.folder;
        }
        return lookup(doc.folderNames, name)
            ?? lookup(doc.rootFolderNames, name)
            ?? doc.folder;
    }

    // File: exact name match first
    const byName = lookup(doc.fileNames, name);
    if (byName) {
        return byName;
    }

    // Then longest matching extension: for "component.test.tsx" try "test.tsx" then "tsx"
    const segments = name.split('.');
    for (let i = 1; i < segments.length; i++) {
        const ext = segments.slice(i).join('.');
        const byExt = lookup(doc.fileExtensions, ext);
        if (byExt) {
            return byExt;
        }
    }

    // Then languageIds — required for themes like Material that route common types
    // (typescript, javascript, python, …) through language associations rather than fileExtensions.
    const languageId = languageRegistry.getLanguageId(rawName);
    if (languageId) {
        const byLang = lookup(doc.languageIds, languageId);
        if (byLang) {
            return byLang;
        }
    }

    return doc.file;
}

function lookup(map: Record<string, string> | undefined, key: string): string | undefined {
    if (!map) {
        return undefined;
    }
    // Try direct, then case-insensitive (some themes use mixed case in keys)
    if (map[key] !== undefined) {
        return map[key];
    }
    for (const k of Object.keys(map)) {
        if (k.toLowerCase() === key) {
            return map[k];
        }
    }
    return undefined;
}

function resolveDefinition(
    def: IconDefinition,
    doc: IconThemeDocument,
    theme: LoadedTheme,
    webview: vscode.Webview,
): ResolvedIcon {
    const resolved: ResolvedIcon = {};
    if (def.iconPath) {
        const fileUri = vscode.Uri.joinPath(theme.baseUri, def.iconPath);
        resolved.iconUri = webview.asWebviewUri(fileUri).toString();
    }
    if (def.fontCharacter) {
        resolved.fontCharacter = def.fontCharacter;
        resolved.fontColor = def.fontColor;
        resolved.fontSize = def.fontSize;
        const font = pickFont(doc.fonts, def.fontId);
        if (font) {
            resolved.fontFamily = fontFamilyFor(font);
        }
    }
    return resolved;
}

function pickFont(fonts: IconThemeDocument['fonts'], fontId: string | undefined): IconFont | undefined {
    if (!fonts || fonts.length === 0) {
        return undefined;
    }
    if (fontId) {
        return fonts.find(f => f.id === fontId) ?? fonts[0];
    }
    return fonts[0];
}

function fontFamilyFor(font: { id?: string }): string {
    return font.id ? `icon-theme-font-${font.id}` : 'icon-theme-font';
}

function buildFontFaces(theme: LoadedTheme, webview: vscode.Webview): IconFontFace[] {
    const fonts = theme.document.fonts;
    if (!fonts || fonts.length === 0) {
        return [];
    }
    return fonts.map(font => ({
        family: fontFamilyFor(font),
        sources: font.src.map(s => ({
            url: webview.asWebviewUri(vscode.Uri.joinPath(theme.baseUri, s.path)).toString(),
            format: s.format,
        })),
        weight: font.weight,
        style: font.style,
        size: font.size,
    }));
}
