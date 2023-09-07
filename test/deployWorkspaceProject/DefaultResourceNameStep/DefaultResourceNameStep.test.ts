/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import { DeployWorkspaceProjectContext } from '../../../extension.bundle';
import { MockDefaultResourceNameStep, MockDefaultResourceNameStepContext } from './MockDefaultResourceNameStep';

suite('DefaultResourceNameStep', async () => {
    test('Create all resources with valid workspace name', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs([], async () => {
                const wizardContext: MockDefaultResourceNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' }
                };

                await runMockDefaultResourceNameStep(wizardContext, true /** areResourcesAvailable */);

                assert.deepStrictEqual(
                    {
                        rootFolder: { name: 'workspace-name' },
                        resourceGroup: undefined,
                        managedEnvironment: undefined,
                        registry: undefined,
                        containerApp: undefined,
                        newResourceGroupName: 'workspace-name',
                        newManagedEnvironmentName: 'workspace-name',
                        newRegistryName: 'workspacename',
                        newContainerAppName: 'workspace-name',
                        imageName: 'workspace-name:latest'
                    } as MockDefaultResourceNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });

    test('Create all resources without valid workspace name', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs(['user-name'], async () => {
                const wizardContext: MockDefaultResourceNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' }
                };

                await runMockDefaultResourceNameStep(wizardContext, false /** areResourcesAvailable */);

                assert.deepStrictEqual(
                    {
                        rootFolder: { name: 'workspace-name' },
                        resourceGroup: undefined,
                        managedEnvironment: undefined,
                        registry: undefined,
                        containerApp: undefined,
                        newResourceGroupName: 'user-name',
                        newManagedEnvironmentName: 'user-name',
                        newRegistryName: 'username',
                        newContainerAppName: 'user-name',
                        imageName: 'user-name:latest'
                    } as MockDefaultResourceNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });

    // Managed environment resources exist, no naming conflicts
    // No managed environment resources exist, naming conflicts

    test('Re-deploy to existing resources', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs([], async () => {
                const wizardContext: MockDefaultResourceNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' },
                    resourceGroup: {},
                    managedEnvironment: {},
                    registry: {},
                    containerApp: { name: 'container-app-1' }
                };

                await runMockDefaultResourceNameStep(wizardContext, true /** areResourcesAvailable */);

                assert.deepStrictEqual(
                    {
                        rootFolder: { name: 'workspace-name' },
                        resourceGroup: {},
                        managedEnvironment: {},
                        registry: {},
                        containerApp: { name: 'container-app-1' },
                        newResourceGroupName: undefined,
                        newManagedEnvironmentName: undefined,
                        newRegistryName: undefined,
                        newContainerAppName: undefined,
                        imageName: 'container-app-1:latest'
                    } as MockDefaultResourceNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });
});

// clean resources workspace name tests

async function runMockDefaultResourceNameStep(context: MockDefaultResourceNameStepContext, areResourcesAvailable: boolean): Promise<void> {
    const mockDefaultResourceNameStep = new MockDefaultResourceNameStep(areResourcesAvailable);
    await mockDefaultResourceNameStep.configureBeforePrompt(context as DeployWorkspaceProjectContext);

    if (mockDefaultResourceNameStep.shouldPrompt(context as DeployWorkspaceProjectContext)) {
        await mockDefaultResourceNameStep.prompt(context as DeployWorkspaceProjectContext);
    }
}

function getMockResultContext(context: MockDefaultResourceNameStepContext): MockDefaultResourceNameStepContext {
    return {
        rootFolder: context.rootFolder,
        resourceGroup: context.resourceGroup,
        managedEnvironment: context.managedEnvironment,
        registry: context.registry,
        containerApp: context.containerApp,
        newResourceGroupName: context.newResourceGroupName,
        newManagedEnvironmentName: context.newManagedEnvironmentName,
        newRegistryName: context.newRegistryName,
        newContainerAppName: context.newContainerAppName,
        imageName: context.imageName
    };
}
