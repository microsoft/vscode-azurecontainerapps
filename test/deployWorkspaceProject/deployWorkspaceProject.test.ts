/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from "vscode";
import { getWorkspaceFolderUri } from "../testUtils";

interface TestCase {
    projectName: string;
}

const testCases: TestCase[] = [
    {
        projectName: 'monorepo-basic'
    }
];

suite('deployWorkspaceProject', async () => {
    for (const testCase of testCases) {
        test(testCase.projectName, async () => {
            const workspaceFolderUri = getWorkspaceFolderUri(testCase.projectName);
            const workspaceFolder = workspace.getWorkspaceFolder(workspaceFolderUri);

            if (workspaceFolder) {
                // Run tests...
            }
        });
    }
});
