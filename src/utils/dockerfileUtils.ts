/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtFsExtra } from '@microsoft/vscode-azext-utils';
import { Uri, workspace } from 'vscode';
import { DOCKERFILE_GLOB_PATTERN } from '../constants';

export async function tryGetFirstDockerfileExposePort(): Promise<number | undefined> {
    if (workspace.workspaceFolders?.length !== 1) {
        // Can't easily identify the workspace root without additional prompting; skip
        return;
    }

    const dockerfileUris: Uri[] = await workspace.findFiles(DOCKERFILE_GLOB_PATTERN);
    if (dockerfileUris.length !== 1) {
        // Can't easily identify the correct Dockerfile without additional prompting; skip
        return;
    }

    const content: string = await AzExtFsExtra.readFile(dockerfileUris[0].path);
    const lines: string[] = content.split('\n');

    for (const line of lines) {
        if (/^EXPOSE/i.test(line.trim())) {
            const ports: string[] = line.match(/\d+{2,5}/) || [];
            return ports[0] ? parseInt(ports[0]) : undefined;
        }
    }

    return undefined;
}
