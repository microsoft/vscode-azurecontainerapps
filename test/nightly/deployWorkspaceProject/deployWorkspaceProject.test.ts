/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { Uri, workspace, type WorkspaceFolder } from "vscode";
import { longRunningTestsEnabled } from '../../global.test';
import { getWorkspaceFolderUri } from "../../testUtils";
import { generateParallelTests, type DwpParallelTestScenario } from './parallelTests';

const testScenarios: DwpParallelTestScenario[] = generateParallelTests();

suite('deployWorkspaceProject', async function (this: Mocha.Suite) {
    this.timeout(15 * 60 * 1000);

    suiteSetup(async function (this: Mocha.Context) {
        if (!longRunningTestsEnabled) {
            this.skip();
        }

        await setupTestProjects();

        for (const s of testScenarios) {
            s.scenario = s.callback();
        }
    });

    for (const s of testScenarios) {
        test(s.title, async function () {
            await nonNullProp(s, 'scenario');
        });
    }
});

async function setupTestProjects() {
    // These starting projects should be the same, so copy them over be starting.
    // We do it this way so we don't need to maintain two copies of the same base project
    await copyTestProjectFiles('basic-js', 'advanced-js');
    await copyTestProjectFiles('monorepo-admincreds', 'monorepo-identity');
}

async function copyTestProjectFiles(sourceFolderName: string, destinationFolderName: string) {
    const sourceFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(getWorkspaceFolderUri(sourceFolderName));
    const destinationFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(getWorkspaceFolderUri(destinationFolderName));

    const sourceUri = Uri.file(nonNullValueAndProp(sourceFolder?.uri, 'fsPath'));
    const destinationUri = Uri.file(nonNullValueAndProp(destinationFolder?.uri, 'fsPath'));

    await workspace.fs.delete(destinationUri, { recursive: true });
    await workspace.fs.copy(sourceUri, destinationUri);
}
