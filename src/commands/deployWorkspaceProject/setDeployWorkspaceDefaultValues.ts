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

export async function getDefaultResourceNames(context: ISubscriptionActionContext, resourceNameBase: string): Promise<DefaultResourceNames> {
    const { managedEnvironment, resourceGroup } = await getMostUsedManagedEnvironmentResources(context) ?? { managedEnvironment: undefined, resourceGroup: undefined };

    resourceNameBase = resourceNameBase.toLowerCase();

    if (!await isNameAvailableForAllResources(context, resourceNameBase, resourceGroup, managedEnvironment)) {
        throw new Error(localize('resourceNamesTaken', 'Resource names matching the current workspace are already taken.'));
    }

    return {
        imageName: `${resourceNameBase}:latest`,
        newResourceGroupName: !resourceGroup ? resourceNameBase : undefined,
        newManagedEnvironmentName: !managedEnvironment ? resourceNameBase : undefined,
        newContainerAppName: resourceNameBase,
        newAzureContainerRegistry: resourceNameBase,
        managedEnvironment,
        resourceGroup
    };
}

async function isNameAvailableForAllResources(context: ISubscriptionActionContext, resourceName: string, resourceGroup?: ResourceGroup, managedEnvironment?: ManagedEnvironment): Promise<boolean> {
    if (!resourceGroup && !await ResourceGroupListStep.isNameAvailable(context, resourceName)) {
        return false;
    }

    if (!managedEnvironment && !await ManagedEnvironmentNameStep.isNameAvailable(context, resourceName, resourceName)) {
        return false;
    }

    if (!await ContainerAppNameStep.isNameAvailable(context, resourceGroup?.name || resourceName, resourceName)) {
        return false;
    }

    // Add acr check

    return true;
}
