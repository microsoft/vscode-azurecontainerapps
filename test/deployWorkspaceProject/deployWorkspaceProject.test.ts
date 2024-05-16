/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { workspace } from "vscode";
import { getWorkspaceFolderUri } from "../testUtils";

interface TestCase {
    folderName: string;
}

const testCases: TestCase[] = [
    {
        folderName: 'monorepo-basic'
    }
];

suite('deployWorkspaceProject', async () => {
    for (const testCase of testCases) {
        test(testCase.folderName, async () => {
            const workspaceFolderUri = getWorkspaceFolderUri(testCase.folderName);
            const workspaceFolder = workspace.getWorkspaceFolder(workspaceFolderUri);

            if (!workspaceFolder) {
                return;
            }

            // Run tests...
            // Figure out order of prompts/answers
            // Deploy
            // Check
            // Some sort of testoutput.json


            // Brainstorm what to actually test for...
            //
        });
    }
});
