/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { accessSync, constants } from 'fs';
import * as path from 'path';

const isWindows: boolean = process.platform === 'win32';
const pathSeparator: string = isWindows ? ';' : ':';

/**
 * Directories where the `az`/`aca` CLIs are commonly installed but which a GUI-launched
 * VS Code (e.g. from the macOS Dock) does NOT inherit on `PATH` — GUI processes only get the
 * paths from `/etc/paths`, not the shell profile. Without this, spawning `az`/`aca` fails with
 * `ENOENT` even though the CLI works in the user's terminal.
 */
function extraBinDirs(): string[] {
    if (isWindows) {
        const programFiles = process.env.ProgramFiles ?? 'C:\\Program Files';
        const programFilesX86 = process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
        return [
            path.join(programFilesX86, 'Microsoft SDKs', 'Azure', 'CLI2', 'wbin'),
            path.join(programFiles, 'Microsoft SDKs', 'Azure', 'CLI2', 'wbin'),
        ];
    }
    const home = process.env.HOME ?? '';
    return [
        '/opt/homebrew/bin',
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
        '/opt/local/bin',
        home ? path.join(home, '.local', 'bin') : '',
    ].filter(Boolean);
}

/**
 * Returns `PATH` augmented with {@link extraBinDirs}, preserving existing entries first so a
 * user's explicit `PATH` ordering still wins. Pass this as the spawned process's `PATH` so
 * the CLI (and anything it shells out to) can be located regardless of how VS Code launched.
 */
export function augmentedPath(): string {
    const existing = (process.env.PATH ?? '').split(pathSeparator).filter(Boolean);
    const merged: string[] = [];
    for (const dir of [...existing, ...extraBinDirs()]) {
        if (!merged.includes(dir)) {
            merged.push(dir);
        }
    }
    return merged.join(pathSeparator);
}

function candidateNames(name: string): string[] {
    if (!isWindows) {
        return [name];
    }
    // On Windows the Azure CLI is `az.cmd` and `aca` is `aca.exe`; also accept a bare name.
    const lower = name.toLowerCase();
    if (lower.endsWith('.exe') || lower.endsWith('.cmd') || lower.endsWith('.bat')) {
        return [name];
    }
    return [`${name}.exe`, `${name}.cmd`, `${name}.bat`, name];
}

function isExecutable(fullPath: string): boolean {
    try {
        // On Windows, X_OK is not meaningful; existence is sufficient.
        accessSync(fullPath, isWindows ? constants.F_OK : constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Resolves an executable name (e.g. `aca`, `az`) to an absolute path by scanning the
 * {@link augmentedPath}. Returns the original value unchanged when it is already an absolute
 * or relative path, or when the executable cannot be found (so the caller's spawn still
 * attempts normal `PATH` resolution and surfaces a clear `ENOENT`).
 */
export function resolveExecutable(name: string): string {
    if (path.isAbsolute(name) || name.includes('/') || (isWindows && name.includes('\\'))) {
        return name;
    }
    for (const dir of augmentedPath().split(pathSeparator).filter(Boolean)) {
        for (const candidate of candidateNames(name)) {
            const full = path.join(dir, candidate);
            if (isExecutable(full)) {
                return full;
            }
        }
    }
    return name;
}
