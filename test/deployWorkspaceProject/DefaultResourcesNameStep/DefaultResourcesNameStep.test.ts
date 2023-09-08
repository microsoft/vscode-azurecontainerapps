/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import { DeployWorkspaceProjectContext, cleanWorkspaceName } from '../../../extension.bundle';
import { MockDefaultResourcesNameStep, MockDefaultResourcesNameStepContext } from './MockDefaultResourcesNameStep';

suite('DefaultResourcesNameStep', async () => {
    test('cleanWorkspaceName', async () => {
        const workspaceNames: string[] = [
            'my_workspace123',
            'my--workspace-name---test',
            '-my_workspace-name-',
            'My_Workspace_Name-123_Test',
            'workspace!',
            'project123@#$%^',
            'a_b_c-d_e-f',
            'workspace@name&symbols',
            'my.workspace',
            '12345',
            ' my workspace name '
        ];

        const cleanedNames: string[] = [
            'myworkspace123',
            'my-workspace-name-test',
            'myworkspace-name',
            'myworkspacename-123test',
            'workspace',
            'project123',
            'abc-de-f',
            'workspacenamesymbols',
            'myworkspace',
            '12345',
            'myworkspacename'
        ];

        for (const [i, name] of Object.entries(workspaceNames)) {
            assert.equal(cleanWorkspaceName(name), cleanedNames[i]);
        }
    });

    // No resources exist yet, no naming conflicts
    test('Create all resources with a valid workspace name', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs([], async () => {
                const wizardContext: MockDefaultResourcesNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' }
                };

                await runMockDefaultResourcesNameStep(wizardContext, true /** workspaceNameAvailable */);

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
                    } as MockDefaultResourcesNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });

    // No resources exist yet, naming conflicts
    test('Create all resources without a valid workspace name', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs(['user-name'], async () => {
                const wizardContext: MockDefaultResourcesNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' }
                };

                await runMockDefaultResourcesNameStep(wizardContext, false /** isWorkspaceNameAvailable */);

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
                    } as MockDefaultResourcesNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });

    // Managed environment resources exist, no naming conflicts
    test('Create container app and registry with a valid workspace name', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs([], async () => {
                const wizardContext: MockDefaultResourcesNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' },
                    resourceGroup: { name: 'acr-build-1' },
                    managedEnvironment: { name: 'acr-build-1' }
                };

                await runMockDefaultResourcesNameStep(wizardContext, true /** workspaceNameAvailable */);

                assert.deepStrictEqual(
                    {
                        rootFolder: { name: 'workspace-name' },
                        resourceGroup: { name: 'acr-build-1' },
                        managedEnvironment: { name: 'acr-build-1' },
                        registry: undefined,
                        containerApp: undefined,
                        newResourceGroupName: undefined,
                        newManagedEnvironmentName: undefined,
                        newRegistryName: 'workspacename',
                        newContainerAppName: 'workspace-name',
                        imageName: 'workspace-name:latest'
                    } as MockDefaultResourcesNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });

    // No managed environment resources exist, naming conflicts
    test('Create container app and registry without a valid workspace name', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs(['user-name'], async () => {
                const wizardContext: MockDefaultResourcesNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' },
                    resourceGroup: { name: 'acr-build-1' },
                    managedEnvironment: { name: 'acr-build-1' }
                };

                await runMockDefaultResourcesNameStep(wizardContext, false /** workspaceNameAvailable */);

                assert.deepStrictEqual(
                    {
                        rootFolder: { name: 'workspace-name' },
                        resourceGroup: { name: 'acr-build-1' },
                        managedEnvironment: { name: 'acr-build-1' },
                        registry: undefined,
                        containerApp: undefined,
                        newResourceGroupName: undefined,
                        newManagedEnvironmentName: undefined,
                        newRegistryName: 'username',
                        newContainerAppName: 'user-name',
                        imageName: 'user-name:latest'
                    } as MockDefaultResourcesNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });

    // All resources already exist
    test('Re-deploy to existing resources', async () => {
        await runWithTestActionContext('deployWorkspaceProject', async context => {
            await context.ui.runWithInputs([], async () => {
                const wizardContext: MockDefaultResourcesNameStepContext = {
                    ...context,
                    rootFolder: { name: 'workspace-name' },
                    resourceGroup: { name: 'acr-build-1' },
                    managedEnvironment: { name: 'acr-build-1' },
                    registry: { name: 'acrbuild1' },
                    containerApp: { name: 'acr-build-1' }
                };

                await runMockDefaultResourcesNameStep(wizardContext, true /** workspaceNameAvailable */);

                assert.deepStrictEqual(
                    {
                        rootFolder: { name: 'workspace-name' },
                        resourceGroup: { name: 'acr-build-1' },
                        managedEnvironment: { name: 'acr-build-1' },
                        registry: { name: 'acrbuild1' },
                        containerApp: { name: 'acr-build-1' },
                        newResourceGroupName: undefined,
                        newManagedEnvironmentName: undefined,
                        newRegistryName: undefined,
                        newContainerAppName: undefined,
                        imageName: 'acr-build-1:latest'
                    } as MockDefaultResourcesNameStepContext,
                    getMockResultContext(wizardContext)
                );
            });
        });
    });
});

async function runMockDefaultResourcesNameStep(context: MockDefaultResourcesNameStepContext, workspaceNameAvailable: boolean): Promise<void> {
    const mockDefaultResourcesNameStep = new MockDefaultResourcesNameStep(workspaceNameAvailable);
    await mockDefaultResourcesNameStep.configureBeforePrompt(context as DeployWorkspaceProjectContext);

    if (mockDefaultResourcesNameStep.shouldPrompt(context as DeployWorkspaceProjectContext)) {
        await mockDefaultResourcesNameStep.prompt(context as DeployWorkspaceProjectContext);
    }
}

function getMockResultContext(context: MockDefaultResourcesNameStepContext): MockDefaultResourcesNameStepContext {
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
