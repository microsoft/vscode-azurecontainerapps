/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Subset of the VS Code file-icon theme JSON schema we consume.
 * See https://code.visualstudio.com/api/extension-guides/file-icon-theme
 */
export interface IconThemeDocument {
    fonts?: IconFont[];
    iconDefinitions?: Record<string, IconDefinition>;
    file?: string;
    folder?: string;
    folderExpanded?: string;
    rootFolder?: string;
    rootFolderExpanded?: string;
    fileNames?: Record<string, string>;
    fileExtensions?: Record<string, string>;
    languageIds?: Record<string, string>;
    folderNames?: Record<string, string>;
    folderNamesExpanded?: Record<string, string>;
    rootFolderNames?: Record<string, string>;
    rootFolderNamesExpanded?: Record<string, string>;
    light?: IconThemeOverrides;
    highContrast?: IconThemeOverrides;
    highContrastLight?: IconThemeOverrides;
    hidesExplorerArrows?: boolean;
}

export type IconThemeOverrides = Omit<IconThemeDocument, 'fonts' | 'light' | 'highContrast' | 'highContrastLight' | 'hidesExplorerArrows'>;

export interface IconFont {
    id?: string;
    src: Array<{ path: string; format: string }>;
    weight?: string;
    style?: string;
    size?: string;
}

export interface IconDefinition {
    iconPath?: string;
    fontCharacter?: string;
    fontColor?: string;
    fontId?: string;
    fontSize?: string;
}

/**
 * Icon data resolved in the extension host and sent to the webview.
 * Either `iconUri` (SVG themes like Material) or `fontCharacter` (font themes like Seti) is set,
 * depending on the active theme's icon definition.
 */
export interface ResolvedIcon {
    /** Webview URI for an SVG icon. */
    iconUri?: string;
    /** Unicode character (e.g. "\\E001") for font-based themes. */
    fontCharacter?: string;
    /** CSS color applied to the font glyph. */
    fontColor?: string;
    /** CSS font-family identifier matching one of the declared @font-face rules. */
    fontFamily?: string;
    /** Optional CSS font-size override (e.g. "150%"). */
    fontSize?: string;
}

export interface IconFontFace {
    /** CSS font-family name (we use the theme's font `id`, or a fallback). */
    family: string;
    /** Webview URIs + formats for @font-face `src`. */
    sources: Array<{ url: string; format: string }>;
    weight?: string;
    style?: string;
    size?: string;
}

export interface IconThemePayload {
    /** VS Code icon-theme id (e.g. "material-icon-theme", "vs-seti"), or null if icons disabled. */
    themeId: string | null;
    /** `@font-face` declarations the webview needs to inject. */
    fontFaces: IconFontFace[];
    /** Map of `nodeKey` → resolved icon. `nodeKey` is built by `makeIconKey` below. */
    icons: Record<string, ResolvedIcon>;
    /** Default fallbacks for unmapped nodes. */
    defaults: {
        file?: ResolvedIcon;
        folder?: ResolvedIcon;
        folderExpanded?: ResolvedIcon;
    };
}

/**
 * Build the lookup key used in IconThemePayload.icons. Must match between
 * extension-host resolver and webview lookup.
 */
export function makeIconKey(name: string, isFolder: boolean, isOpen: boolean): string {
    const normalized = name.endsWith('/') ? name.slice(0, -1) : name;
    return `${isFolder ? 'F' : 'f'}:${isOpen ? '1' : '0'}:${normalized.toLowerCase()}`;
}

export interface IconRequest {
    name: string;
    isFolder: boolean;
    isOpen: boolean;
}
