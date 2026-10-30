/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { accessSync, constants } from 'fs';
import * as path from 'path';

const isWindows: boolean = process.platform === 'win32';
const pathSeparator: string = isWindows ? ';' : ':';

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

export function augmentedPath(): string {
    const existing = (process.env.PATH ?? '').split(pathSeparator).filter(Boolean);
    return [...new Set([...existing, ...extraBinDirs()])].join(pathSeparator);
}

function candidateNames(name: string): string[] {
    if (!isWindows) {
        return [name];
    }
    const lower = name.toLowerCase();
    if (lower.endsWith('.exe') || lower.endsWith('.cmd') || lower.endsWith('.bat')) {
        return [name];
    }
    return [`${name}.exe`, `${name}.cmd`, `${name}.bat`, name];
}

function isExecutable(fullPath: string): boolean {
    try {
        accessSync(fullPath, isWindows ? constants.F_OK : constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

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
