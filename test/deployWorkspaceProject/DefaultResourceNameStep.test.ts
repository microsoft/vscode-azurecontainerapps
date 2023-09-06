/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { DefaultResourcesNameStep, DeployWorkspaceProjectContext } from '../../extension.bundle';

interface MockDefaultResourceNameStepContext {
    rootFolder: { name: string };

    resourceGroup?: object;
    managedEnvironment?: object;
    registry?: object;
    containerApp?: object;

    newResourceGroupName?: string;
    newManagedEnvironmentName?: string;
    newRegistryName?: string;
    newContainerAppName?: string;
}

suite('DefaultResourceNameStep', async () => {
    // No resources exist, no naming conflicts
    // No resources exist, naming conflicts

    // Managed environment resources exist, no naming conflicts
    // No managed environment resources exist, naming conflicts

    test('Deploy to existing resources', async () => {
        const wizardContext: MockDefaultResourceNameStepContext = {
            resourceGroup: {},
            managedEnvironment: {},
            registry: {},
            containerApp: {}
        };

        const mockDefaultResourceNameStep = new MockDefaultResourceNameStep(true /** areResourcesAvailable */);
        await mockDefaultResourceNameStep.prompt(wizardContext as DeployWorkspaceProjectContext);
        assert()
    });
});

// clean resources workspace name tests

class MockDefaultResourceNameStep extends DefaultResourcesNameStep {
    constructor(readonly areResourcesAvailable: boolean) {
        super();
    }

    // Mock the service validation calls
    protected areAllResourcesAvailable(): Promise<boolean> {
        return Promise.resolve(this.areResourcesAvailable);
    }
}
