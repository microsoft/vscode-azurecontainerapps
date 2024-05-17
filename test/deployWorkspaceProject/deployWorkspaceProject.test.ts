/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import { workspace } from "vscode";
import { deployWorkspaceProject } from '../../extension.bundle';
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

            await runWithTestActionContext('deployWorkspaceProject', async context => {
                await context.ui.runWithInputs([
                    'app1/Dockerfile',  // dockerfile
                    new RegExp('Create new container apps environment', 'i'), // create new cae
                    'Continue', // confirm
                    'my-test-env', // name of env
                    'app1',  // name of CA resources
                    './app1',  // src code directory
                    'app1/.env.example',  // environment var file
                    'East US',  // resource location
                    'Save'  // save files
                ], async () => {
                    const result = await deployWorkspaceProject(context);
                    console.log(result);


                    // Multiple Dockerfiles
                    // Single Dockerfiles
                    // Multiple environment variables
                    // Single environment variables?
                    // Skip for now environment variables
                    // Use again
                });
            });
        });
    }
});
