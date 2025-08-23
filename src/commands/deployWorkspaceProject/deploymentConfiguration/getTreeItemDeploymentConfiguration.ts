/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type Workspace } from "@azure/arm-operationalinsights";
import { AzureWizard } from "@microsoft/vscode-azext-utils";
import { type ContainerAppItem } from "../../../tree/ContainerAppItem";
import { LogAnalyticsListStep } from "../../createManagedEnvironment/LogAnalyticsListStep";
import { type IContainerAppContext } from "../../IContainerAppContext";
import { RootFolderStep } from "../../image/imageSource/buildImageInAzure/RootFolderStep";
import { getResourcesFromContainerAppHelper, type ContainerAppsResources } from "../internal/getStartingConfiguration/containerAppResourceHelpers";
import { type DeploymentConfiguration } from "./DeploymentConfiguration";
import { DeploymentMode } from "./workspace/DeploymentModeListStep";

type TreeItemDeploymentConfigurationContext = IContainerAppContext & DeploymentConfiguration;

export async function getTreeItemDeploymentConfiguration(context: IContainerAppContext, item: ContainerAppItem): Promise<DeploymentConfiguration> {
    const wizardContext: TreeItemDeploymentConfigurationContext = context;

    const wizard: AzureWizard<TreeItemDeploymentConfigurationContext> = new AzureWizard(wizardContext, {
        promptSteps: [new RootFolderStep()],
    });

    await wizard.prompt();
    await wizard.execute();

    return {
        ...await getContainerAppsResources(context, item),
        deploymentMode: DeploymentMode.Advanced,
        rootFolder: wizardContext.rootFolder,
        registry: wizardContext.registry,
        shouldSaveDeploySettings: false,
    };
}

async function getContainerAppsResources(context: IContainerAppContext, item: ContainerAppItem): Promise<ContainerAppsResources & { logAnalyticsWorkspace?: Workspace }> {
    const containerAppsResources: ContainerAppsResources = await getResourcesFromContainerAppHelper(context, item.containerApp);

    const workspaces: Workspace[] = await LogAnalyticsListStep.getLogAnalyticsWorkspaces(context);
    const logAnalyticsWorkspace: Workspace | undefined = workspaces.find(w => w.customerId && w.customerId === containerAppsResources.managedEnvironment?.appLogsConfiguration?.logAnalyticsConfiguration?.customerId);

    return Object.assign(containerAppsResources, { logAnalyticsWorkspace });
}
