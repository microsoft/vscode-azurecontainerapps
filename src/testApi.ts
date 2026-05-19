/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type IAzExtOutputChannel, type TreeElementStateManager } from "@microsoft/vscode-azext-utils";
import { type AzureResourcesExtensionApi } from "@microsoft/vscode-azureresources-api";
import * as api from "../src/commands/api/vscode-azurecontainerapps.api";
import { type deployWorkspaceProjectApiInternal } from "./commands/api/deployWorkspaceProjectApi";
import { createContainerApp } from "./commands/createContainerApp/createContainerApp";
import { createManagedEnvironment } from "./commands/createManagedEnvironment/createManagedEnvironment";
import { deployContainerApp } from "./commands/deployContainerApp/deployContainerApp";
import { deployWorkspaceProject } from "./commands/deployWorkspaceProject/deployWorkspaceProject";
import { type ContainerAppsBranchDataProvider } from "./tree/ContainerAppsBranchDataProvider";

/**
 * Test-only API for accessing internal extension state.
 * This API is only available when VSCODE_RUNNING_TESTS environment variable is set.
 * It should NEVER be used in production code.
 */
export interface AzureContainerAppsTestApi extends api.AzureContainerAppsExtensionApi {
    apiVersion: '99.0.0';
    extensionVariables: {
        getOutputChannel(): Promise<IAzExtOutputChannel>;
        getRgApiV2(): Promise<AzureResourcesExtensionApi>;
        getState(): Promise<TreeElementStateManager>;
        getBranchDataProvider(): Promise<ContainerAppsBranchDataProvider>;
    };
    /** A private test export for {@link createContainerApp} */
    createContainerAppInternal: typeof createContainerApp;
    /** A private test export for {@link createManagedEnvironment} */
    createManagedEnvironmentInternal: typeof createManagedEnvironment;
    /** A private test export for {@link deployContainerApp} */
    deployContainerAppInternal: typeof deployContainerApp;
    /** A private test export for {@link deployWorkspaceProject} */
    deployWorkspaceProjectInternal: typeof deployWorkspaceProject;
    /** A private test export for {@link deployWorkspaceProjectApiInternal} */
    deployWorkspaceProjectApiInternal: typeof deployWorkspaceProjectApiInternal;
}
