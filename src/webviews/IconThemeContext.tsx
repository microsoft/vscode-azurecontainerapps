/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createContext, useContext, useEffect, useMemo, type JSX, type ReactNode } from 'react';
import { type IconThemePayload, type ResolvedIcon, makeIconKey } from '../utils/iconTheme/types';

interface IconThemeContextValue {
    payload: IconThemePayload | null;
    resolve: (name: string, isFolder: boolean, isOpen: boolean) => ResolvedIcon | undefined;
}

const IconThemeContext = createContext<IconThemeContextValue>({
    payload: null,
    resolve: () => undefined,
});

export const IconThemeProvider = ({
    payload,
    children,
}: {
    payload: IconThemePayload | null;
    children: ReactNode;
}): JSX.Element => {
    const value = useMemo<IconThemeContextValue>(() => ({
        payload,
        resolve: (name, isFolder, isOpen) => {
            if (!payload) {
                return undefined;
            }
            const direct = payload.icons[makeIconKey(name, isFolder, isOpen)];
            if (direct) {
                return direct;
            }
            if (isFolder) {
                return isOpen ? payload.defaults.folderExpanded ?? payload.defaults.folder : payload.defaults.folder;
            }
            return payload.defaults.file;
        },
    }), [payload]);

    // Inject @font-face rules for font-based icon themes (e.g. Seti).
    useEffect(() => {
        if (!payload || payload.fontFaces.length === 0) {
            return;
        }
        const styleEl = document.createElement('style');
        styleEl.dataset.iconTheme = payload.themeId ?? '';
        const rules = payload.fontFaces.map(face => {
            const src = face.sources
                .map(s => `url(${JSON.stringify(s.url)}) format(${JSON.stringify(s.format)})`)
                .join(', ');
            const weight = face.weight ? `font-weight: ${face.weight};` : '';
            const style = face.style ? `font-style: ${face.style};` : '';
            return `@font-face { font-family: ${JSON.stringify(face.family)}; src: ${src}; ${weight} ${style} }`;
        }).join('\n');
        styleEl.textContent = rules;
        document.head.appendChild(styleEl);
        return () => {
            styleEl.remove();
        };
    }, [payload]);

    return <IconThemeContext.Provider value={value}>{children}</IconThemeContext.Provider>;
};

export const useIconTheme = (): IconThemeContextValue => useContext(IconThemeContext);

/**
 * Render a themed icon for a tree node. Falls back to a codicon when the theme has no resolution.
 */
export const ThemedNodeIcon = ({ name, isFolder, isOpen }: { name: string; isFolder: boolean; isOpen: boolean }): JSX.Element => {
    const { resolve } = useIconTheme();
    const icon = resolve(name, isFolder, isOpen);

    if (icon?.iconUri) {
        return <img className='treeIcon themedIcon' src={icon.iconUri} alt='' aria-hidden='true' />;
    }
    if (icon?.fontCharacter) {
        // fontCharacter is a JSON-escaped codepoint like "\E001" (or "\\E001" in source).
        // Parse to the actual character so CSS `content` / text nodes render correctly.
        const char = parseFontCharacter(icon.fontCharacter);
        const style: React.CSSProperties = {
            fontFamily: icon.fontFamily,
            color: icon.fontColor,
            fontSize: icon.fontSize,
        };
        return <span className='treeIcon themedFontIcon' style={style} aria-hidden='true'>{char}</span>;
    }

    // Codicon fallback
    const fallback = isFolder
        ? (isOpen ? 'codicon-folder-opened' : 'codicon-folder')
        : 'codicon-file';
    return <span className={`treeIcon codicon ${fallback}`} aria-hidden='true' />;
};

function parseFontCharacter(raw: string): string {
    // Accepts "\E001", "\\E001", or a literal character. Converts to the literal character.
    const match = raw.match(/^\\+([0-9A-Fa-f]{1,6})$/);
    if (match) {
        return String.fromCodePoint(parseInt(match[1], 16));
    }
    return raw;
}
