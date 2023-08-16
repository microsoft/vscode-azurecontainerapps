/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ManagedEnvironment } from "@azure/arm-appcontainers";
import { ResourceGroup } from "@azure/arm-resources";
import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext, nonNullValue } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../constants";
import { localize } from "../../utils/localize";
import { ContainerAppNameStep } from "../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { EnvironmentVariablesListStep } from "../deployImage/imageSource/EnvironmentVariablesListStep";
import { AcrBuildSupportedOS } from "../deployImage/imageSource/buildImageInAzure/OSPickStep";
import { IDeployWorkspaceProjectContext } from "./deployWorkspaceProject";
import { getMostUsedManagedEnvironmentResources } from "./getMostUsedManagedEnvironmentResources";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";

export async function setDeployWorkspaceDefaultValues(context: ISubscriptionActionContext): Promise<Partial<IDeployWorkspaceProjectContext>> {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths();
    const resourceBaseName: string = nonNullValue(rootFolder.uri.path.split('/').at(-1));

    return {
        ...await getDefaultResourceNames(context, resourceBaseName),
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        rootFolder,
        dockerfilePath,
        environmentVariables: await EnvironmentVariablesListStep.workspaceHasEnvFile() ? undefined : []
    };
}

interface DefaultResourceNames {
    // Found existing resources
    resourceGroup?: ResourceGroup;
    managedEnvironment?: ManagedEnvironment;

    // Need to create new resources
    newResourceGroupName?: string;
    newManagedEnvironmentName?: string;

    newContainerAppName: string;
    newAzureContainerRegistry: string;
    imageName: string;
}

export async function getDefaultResourceNames(context: ISubscriptionActionContext, resourceBaseName: string): Promise<DefaultResourceNames> {
    const { managedEnvironment, resourceGroup } = await getMostUsedManagedEnvironmentResources(context) ?? { managedEnvironment: undefined, resourceGroup: undefined };

    // Try new names until we find original ones
    let foundAvailableNames: boolean = false;
    let resourceName: string = resourceBaseName;
    for (let i = 0; i <= 10; i++) {
        if (i) {
            resourceName = `${resourceBaseName}${i}`;
        }

        if (!resourceGroup && !await ResourceGroupListStep.isNameAvailable(context, resourceName)) {
            continue;
        }

        if (!managedEnvironment && !await ManagedEnvironmentNameStep.isNameAvailable(context, resourceName, resourceName)) {
            continue;
        }

        if (!await ContainerAppNameStep.isNameAvailable(context, resourceGroup?.name || resourceName, resourceName)) {
            continue;
        }

        // add acr check

        foundAvailableNames = true;
        break;
    }

    if (!foundAvailableNames) {
        // Eventually update this message to tell user to run `Advanced` if all names are already taken
        throw new Error(localize('defaultNameError', 'All default resource names are already taken, please remove any unused resources and try again.'));
    }

    return {
        imageName: `${resourceName}:latest`,
        newResourceGroupName: !resourceGroup ? resourceName : undefined,
        newManagedEnvironmentName: !managedEnvironment ? resourceName : undefined,
        newContainerAppName: resourceName,
        newAzureContainerRegistry: resourceName,
        managedEnvironment,
        resourceGroup
    };
}
