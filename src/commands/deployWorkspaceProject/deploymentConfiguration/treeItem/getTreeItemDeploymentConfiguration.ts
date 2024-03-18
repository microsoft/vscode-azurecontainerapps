/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem } from "../../../../tree/ContainerAppItem";
import { type ManagedEnvironmentItem } from "../../../../tree/ManagedEnvironmentItem";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { RootFolderStep } from "../../../image/imageSource/buildImageInAzure/RootFolderStep";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";
import { TreeItemResourcesVerifyStep } from "./TreeItemResourcesVerifyStep";

export type TreeItemDeploymentConfigurationContext = IContainerAppContext & DeploymentConfiguration;

export async function getTreeItemDeploymentConfiguration(context: IContainerAppContext, item: ContainerAppItem | ManagedEnvironmentItem): Promise<DeploymentConfiguration> {
    const wizardContext: TreeItemDeploymentConfigurationContext = context;

    const wizard: AzureWizard<TreeItemDeploymentConfigurationContext> = new AzureWizard(wizardContext, {
        promptSteps: [new RootFolderStep()],
        executeSteps: [new TreeItemResourcesVerifyStep(item)],
    });

    await wizard.prompt();
    await wizard.execute();

    return {
        rootFolder: wizardContext.rootFolder,
        resourceGroup: wizardContext.resourceGroup,
        managedEnvironment: wizardContext.managedEnvironment,
        containerApp: wizardContext.containerApp
    };
}
