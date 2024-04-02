/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { ManagedEnvironmentItem } from "../../../tree/ManagedEnvironmentItem";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { RootFolderStep } from "../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeploymentConfiguration } from "./DeploymentConfiguration";
import { TryUseExistingWorkspaceRegistryStep } from "./workspace/azureResources/TryUseExistingWorkspaceRegistryStep";

type TreeItemDeploymentConfigurationContext = IContainerAppContext & DeploymentConfiguration;

export async function getTreeItemDeploymentConfiguration(context: IContainerAppContext, item: ContainerAppItem | ManagedEnvironmentItem): Promise<DeploymentConfiguration> {
    const wizardContext: TreeItemDeploymentConfigurationContext = context;

    const wizard: AzureWizard<TreeItemDeploymentConfigurationContext> = new AzureWizard(wizardContext, {
        promptSteps: [new RootFolderStep()],
        executeSteps: [new TryUseExistingWorkspaceRegistryStep()]
    });

    await wizard.prompt();
    await wizard.execute();

    return {
        rootFolder: wizardContext.rootFolder,
        managedEnvironment: ManagedEnvironmentItem.isManagedEnvironmentItem(item) ? (item as ManagedEnvironmentItem).managedEnvironment : undefined,
        containerApp: ContainerAppItem.isContainerAppItem(item) ? (item as ContainerAppItem).containerApp : undefined,
        registry: wizardContext.registry,

        // If it's a container app item, safe to assume it's a re-deployment, so don't re-prompt to save
        // If it's anything else, it's a first-time deployment, so it makes sense to ask to save
        shouldSaveDeploySettings: ContainerAppItem.isContainerAppItem(item) ? false : undefined
    };
}
