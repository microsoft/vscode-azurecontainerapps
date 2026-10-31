/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { ContainerAppItem } from "../../../tree/ContainerAppItem";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { RootFolderStep } from "../../image/imageSource/buildImageInAzure/RootFolderStep";
import { getResourcesFromContainerAppHelper } from "../internal/getStartingConfiguration/containerAppResourceHelpers";
import { type DeploymentConfiguration } from "./DeploymentConfiguration";
import { DeploymentMode } from "./workspace/DeploymentModeListStep";

type TreeItemDeploymentConfigurationContext = IContainerAppContext & DeploymentConfiguration;

export async function getTreeItemDeploymentConfiguration(context: IContainerAppContext, item: ContainerAppItem): Promise<DeploymentConfiguration> {
    const containerApp = await ContainerAppItem.Get(context, item.subscription, item.containerApp.resourceGroup, item.containerApp.name);
    const wizardContext: TreeItemDeploymentConfigurationContext = { ...context, containerApp };

    const wizard = new AzureWizard<TreeItemDeploymentConfigurationContext>(wizardContext, {
        promptSteps: [new RootFolderStep()],
    });

    await wizard.prompt();
    await wizard.execute();

    return {
        ...await getResourcesFromContainerAppHelper(context, containerApp),
        deploymentMode: DeploymentMode.Advanced,
        rootFolder: wizardContext.rootFolder,
        registry: wizardContext.registry,
        shouldSaveDeploySettings: false,
    };
}
