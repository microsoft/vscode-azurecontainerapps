/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ResourceGroupListStep } from "@microsoft/vscode-azext-azureutils";
import { ISubscriptionActionContext, nonNullValue } from "@microsoft/vscode-azext-utils";
import { ImageSource } from "../../constants";
import { localize } from "../../utils/localize";
import { ContainerAppNameStep } from "../createContainerApp/ContainerAppNameStep";
import { ManagedEnvironmentNameStep } from "../createManagedEnvironment/ManagedEnvironmentNameStep";
import { AcrBuildSupportedOS } from "../deployImage/imageSource/buildImageInAzure/OSPickStep";
import { getWorkspaceProjectPaths } from "./getWorkspaceProjectPaths";

export async function setDeployWorkspaceDefaultValues(context: ISubscriptionActionContext) {
    const { rootFolder, dockerfilePath } = await getWorkspaceProjectPaths();
    // Add a fallback?
    const resourceBaseName: string = nonNullValue(rootFolder.uri.path.split('/').at(-1));

    return {
        ...await getDefaultResourceNames(context, resourceBaseName),
        imageSource: ImageSource.RemoteAcrBuild,
        os: AcrBuildSupportedOS.Linux,
        rootFolder,
        dockerfilePath,
        skipIngressPrompt: true
    };
}

interface DefaultResourceNames {
    newResourceGroupName: string;
    newManagedEnvironmentName: string;
    newContainerAppName: string;
    newAzureContainerRegistry: string;
    imageName: string;
}

export async function getDefaultResourceNames(context: ISubscriptionActionContext, resourceBaseName: string): Promise<DefaultResourceNames> {
    let newResourceGroupName: string = `${resourceBaseName}-rg`;
    let newManagedEnvironmentName: string = `${resourceBaseName}-env`;
    let newContainerAppName: string = `${resourceBaseName}-ca`;
    let newAzureContainerRegistry: string = `${resourceBaseName}-acr`;
    let imageName: string = `${resourceBaseName}:latest`;

    // Try new names until we find original ones
    let foundAvailableNames: boolean = false;
    for (let i = 0; i <= 10; i++) {
        if (i) {
            newResourceGroupName = `${resourceBaseName}-rg-${i}`;
            newManagedEnvironmentName = `${resourceBaseName}-env-${i}`;
            newContainerAppName = `${resourceBaseName}-ca-${i}`;
            newAzureContainerRegistry = `${resourceBaseName}-acr-${i}`;
        }

        if (!await ResourceGroupListStep.isNameAvailable(context, newResourceGroupName)) {
            continue;
        }

        if (!await ManagedEnvironmentNameStep.isNameAvailable(context, newResourceGroupName, newManagedEnvironmentName)) {
            continue;
        }

        if (!await ContainerAppNameStep.isNameAvailable(context, newResourceGroupName, newContainerAppName)) {
            continue;
        }

        // add acr check
        // break;

        // Put both of these before the break in the last if check
        imageName = `${resourceBaseName}-${i}:latest`;
        foundAvailableNames = true;
    }

    if (!foundAvailableNames) {
        // Eventually update this message to tell user to run `Advanced` if all names are already taken
        throw new Error(localize('defaultNameError', 'All default resource names are already taken, please remove any unused resources and try again.'));
    }

    return {
        imageName,
        newResourceGroupName,
        newManagedEnvironmentName,
        newContainerAppName,
        newAzureContainerRegistry
    };
}
