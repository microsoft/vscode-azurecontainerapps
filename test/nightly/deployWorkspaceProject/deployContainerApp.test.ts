/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from '@azure/arm-appcontainers';
import { parseAzureResourceId } from '@microsoft/vscode-azext-azureutils';
import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import * as path from 'path';
import { workspace, type Uri, type WorkspaceFolder } from 'vscode';
import { createContainerApp, createManagedEnvironment, deployContainerApp, parseError, randomUtils, type ContainerAppItem, type DeployWorkspaceProjectResults, type IParsedError } from '../../../extension.bundle';
import { longRunningTestsEnabled } from '../../global.test';
import { assertStringPropsMatch, getWorkspaceFolderUri } from '../../testUtils';
import { resourceGroupsToDelete } from '../global.nightly.test';
import { dwpTestUtils } from './dwpTestUtils';

suite('deployContainerApp.deployWorkspaceProject', async function (this: Mocha.Suite) {
    this.timeout(15 * 60 * 1000);

    suiteSetup(async function (this: Mocha.Context) {
        if (!longRunningTestsEnabled) {
            this.skip();
        }
    });

    test('should deploy properly from the container app item entry-point', async function () {
        const containerAppItem = await createContainerAppItem();

        const folderName: string = 'monorepo-admincreds';
        const workspaceFolderUri: Uri = getWorkspaceFolderUri(folderName);
        const rootFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(workspaceFolderUri);
        assert.ok(rootFolder?.uri.fsPath, `Failed to find "${folderName}" root folder path.`);

        const acrResourceName: string = 'dwpitemacr' + randomUtils.getRandomHexString(4);
        const imageName: string = 'app1:latest';

        const testInputs = [
            'Workspace Project',
            new RegExp(folderName, 'i'),
            new RegExp('Create new container registry', 'i'),
            acrResourceName,
            'Standard',
            'Docker Login Credentials',
            'Enable',
            path.join('app1', 'Dockerfile'),
            `.${path.sep}app1`,
            imageName,
            path.join('app1', '.env.example'),
            'Continue',
        ];

        let results: DeployWorkspaceProjectResults = {};
        await runWithTestActionContext('deployContainerApp.deployWorkspaceProject', async context => {
            await context.ui.runWithInputs(testInputs, async () => {
                let perr: IParsedError | undefined;
                try {
                    results = await deployContainerApp(context, containerAppItem) ?? {};
                } catch (e) {
                    perr = parseError(e);
                    console.log(perr);
                }
            });
        });

        const sharedResourcesName: string = parseAzureResourceId(containerAppItem.containerApp.managedEnvironmentId).resourceName;
        const expectedResults = dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourcesName, acrResourceName, containerAppItem.containerApp.name);
        expectedResults.imageName = imageName;

        assertStringPropsMatch(results as Partial<Record<string, string>>, expectedResults as Record<string, string | RegExp>, 'DeployWorkspaceProject results mismatch.');
    });
});

async function createContainerAppItem(): Promise<ContainerAppItem> {
    const managedEnvironment = await wrapWithTryCatch(async () => {
        let managedEnvironment: ManagedEnvironment | undefined;
        await runWithTestActionContext('deployContainerApp.deployWorkspaceProject.createManagedEnvironment', async context => {
            const resourceName: string = 'dwp-item' + randomUtils.getRandomHexString(4);
            await context.ui.runWithInputs([resourceName, 'East US'], async () => {
                managedEnvironment = await createManagedEnvironment(context);
            });
        });
        return managedEnvironment;
    });

    const containerAppItem = await wrapWithTryCatch(async () => {
        let containerAppItem: ContainerAppItem | undefined;
        await runWithTestActionContext('deployContainerApp.deployWorkspaceProject.createContainerApp', async context => {
            const resourceName: string = 'dwp-item' + randomUtils.getRandomHexString(4);
            await context.ui.runWithInputs([managedEnvironment?.name ?? '', resourceName], async () => {
                containerAppItem = await createContainerApp(context);
            });
        });
        return containerAppItem;
    });

    if (managedEnvironment?.name) {
        resourceGroupsToDelete.add(managedEnvironment.name);
    }

    assert.ok(containerAppItem, 'Failed to setup the starting container app item.');
    return containerAppItem;
}

async function wrapWithTryCatch<T>(testAction: () => Promise<T>): Promise<T> {
    try {
        return await testAction();
    } catch (e) {
        console.error(e);
        throw e;
    }
}
