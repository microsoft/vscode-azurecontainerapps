/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep, parseAzureResourceGroupId, ResourceGroupCreateStep, type IResourceGroupWizardContext } from '@microsoft/vscode-azext-azureutils';
import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import * as path from 'path';
import { workspace, type Uri, type WorkspaceFolder } from 'vscode';
import { AzureWizard, deployWorkspaceProjectApi, randomUtils, type DeployWorkspaceProjectResults } from '../../../extension.bundle';
import { longRunningTestsEnabled } from '../../global.test';
import { assertStringPropsMatch, getWorkspaceFolderUri } from '../../testUtils';
import { resourceGroupsToDelete, subscriptionContext } from '../global.nightly.test';
import { dwpTestUtils } from './dwpTestUtils';

suite('deployWorkspaceProjectApi', async function (this: Mocha.Suite) {
    this.timeout(15 * 60 * 1000);

    suiteSetup(async function (this: Mocha.Context) {
        if (!longRunningTestsEnabled) {
            this.skip();
        }
    });

    test('should be able to deploy containerized function project', async function () {
        // We need to start with an empty resource group to simulate the starting point for Azure Functions
        const resourceGroupId: string = await createResourceGroup();

        const folderName: string = 'containerized-functions';
        const workspaceFolderUri: Uri = getWorkspaceFolderUri(folderName);
        const rootFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(workspaceFolderUri);
        assert.ok(rootFolder?.uri.fsPath, `Failed to find "${folderName}" root folder path.`);

        const deploymentSettings = {
            resourceGroupId,
            rootPath: rootFolder.uri.fsPath,
            srcPath: rootFolder.uri.fsPath,
            dockerfilePath: path.join(rootFolder.uri.fsPath, 'Dockerfile'),
            suppressConfirmation: true,
            suppressContainerAppCreation: true,
            shouldSaveDeploySettings: true,
        };
        const results: DeployWorkspaceProjectResults = await deployWorkspaceProjectApi(deploymentSettings);

        const parsedResourceGroup = parseAzureResourceGroupId(resourceGroupId);
        const sharedResourceName = parsedResourceGroup.resourceGroup;
        const acrResourceName = sharedResourceName.replace(/[^a-zA-Z0-9]+/g, '');

        const expectedResults = dwpTestUtils.generateExpectedResultsWithCredentials(sharedResourceName, acrResourceName, '');
        expectedResults.containerAppId = undefined;
        expectedResults.imageName = new RegExp(sharedResourceName, 'i');

        assertStringPropsMatch(results as Partial<Record<string, string>>, expectedResults as Record<string, string | RegExp>, 'DeployWorkspaceProject results mismatch.');
    });
});

type ResourceGroupId = string;

async function createResourceGroup(): Promise<ResourceGroupId> {
    let resourceGroupId: string | undefined;

    await runWithTestActionContext('deployWorkspaceProjectApi.createResourceGroup', async context => {
        const newResourceGroupName = 'dwp-api' + randomUtils.getRandomHexString(4);
        const wizardContext: IResourceGroupWizardContext = {
            ...context,
            ...subscriptionContext,
            newResourceGroupName,
        }
        await LocationListStep.setLocation(wizardContext, 'eastus');

        const wizard: AzureWizard<IResourceGroupWizardContext> = new AzureWizard(wizardContext, {
            executeSteps: [new ResourceGroupCreateStep()],
        });
        await wizard.execute();

        resourceGroupId = wizardContext.resourceGroup?.id;
        resourceGroupsToDelete.add(newResourceGroupName);
    });

    assert.ok(resourceGroupId, 'Failed to setup an empty resource group to test containerized function deployment.');
    return resourceGroupId;
}
