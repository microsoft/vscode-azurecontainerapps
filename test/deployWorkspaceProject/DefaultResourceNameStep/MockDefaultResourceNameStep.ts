/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { DefaultResourcesNameStep } from "../../../extension.bundle";

export interface MockDefaultResourceNameStepContext {
    rootFolder: { name: string };

    resourceGroup?: { name: string };
    managedEnvironment?: { name: string };
    registry?: { name: string };
    containerApp?: { name: string };

    newResourceGroupName?: string;
    newManagedEnvironmentName?: string;
    newRegistryName?: string;
    newContainerAppName?: string;

    imageName?: string;
}

export class MockDefaultResourceNameStep extends DefaultResourcesNameStep {
    constructor(readonly workspaceNameAvailable: boolean) {
        super();
    }

    protected validateNameAvailability(): Promise<string | undefined> {
        return Promise.resolve(undefined);
    }

    protected isWorkspaceNameAvailable(): Promise<boolean> {
        return Promise.resolve(this.workspaceNameAvailable);
    }
}
