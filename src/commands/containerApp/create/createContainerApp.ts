/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LocationListStep, VerifyProvidersStep } from "@microsoft/vscode-azext-azureutils";
import { AzExtTreeItem, AzureWizard, AzureWizardExecuteStep, AzureWizardPromptStep, IActionContext, ICreateChildImplContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AppResource } from "@microsoft/vscode-azext-utils/hostapi";
import { appProvider, envFilter } from "../../../constants";
import { ext } from "../../../extensionVariables";
import { ContainerAppResource } from "../../../resolver/ContainerAppResource";
import { ContainerAppsExtResolver } from "../../../resolver/ContainerAppsExtResolver";
import { ManagedEnvironmentResource } from "../../../resolver/ManagedEnvironmentResource";
import { createActivityContext } from "../../../utils/activityUtils";
import { localize } from "../../../utils/localize";
import { ContainerRegistryListStep } from "../deployImage/ContainerRegistryListStep";
import { ContainerAppCreateStep } from "./ContainerAppCreateStep";
import { ContainerAppNameStep } from "./ContainerAppNameStep";
import { EnableIngressStep } from "./EnableIngressStep";
import { EnvironmentVariablesListStep } from "./EnvironmentVariablesListStep";
import { IContainerAppContext } from "./IContainerAppContext";
import { showContainerAppCreated } from "./showContainerAppCreated";

export async function createContainerApp(context: IActionContext & Partial<ICreateChildImplContext> & Partial<IContainerAppContext>,
    node?: AzExtTreeItem): Promise<ContainerAppResource> {

    if (!node) {
        node = await ext.rgApi.pickAppResource(context, {
            filter: envFilter,
        });
    }
    const envTreeItem = node as unknown as AzExtTreeItem & ManagedEnvironmentResource;
    const env = envTreeItem.data;
    const wizardContext: IContainerAppContext = {
        ...context, ...node.subscription,
        ...(await createActivityContext()), managedEnvironmentId: nonNullProp(env, 'id')
    };

    const title: string = localize('createContainerApp', 'Create Container App');
    const promptSteps: AzureWizardPromptStep<IContainerAppContext>[] =
        [new ContainerAppNameStep(), new ContainerRegistryListStep(), new EnvironmentVariablesListStep(), new EnableIngressStep()];
    const executeSteps: AzureWizardExecuteStep<IContainerAppContext>[] = [new VerifyProvidersStep([appProvider]), new ContainerAppCreateStep()];

    wizardContext.newResourceGroupName = envTreeItem.resourceGroupName;
    await LocationListStep.setLocation(wizardContext, env.location);

    const wizard: AzureWizard<IContainerAppContext> = new AzureWizard(wizardContext, {
        title,
        promptSteps,
        executeSteps,
        showLoadingPrompt: true
    });

    await wizard.prompt();
    try {
        await wizard.execute();
    } finally {
        // refresh this node even if create fails because container app provision failure throws an error, but still creates a container app
        await node.refresh(context);
    }


    const ca = nonNullProp(wizardContext, 'containerApp');
    const appResource: AppResource = {
        id: nonNullProp(ca, 'id'),
        name: nonNullProp(ca, 'name'),
        type: nonNullProp(ca, 'type'),
        ...ca
    };



    const caNode = await new ContainerAppsExtResolver().resolveResource(node.subscription, appResource) as ContainerAppResource;
    void showContainerAppCreated(caNode);

    await node.refresh(context);
    return caNode;
}
