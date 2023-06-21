/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, KnownActiveRevisionsMode, Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzureWizard, IActionContext, IAzureQuickPickItem, createSubscriptionContext, nonNullProp, nonNullValue } from "@microsoft/vscode-azext-utils";
import { AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { ext } from "../../../extensionVariables";
import { ContainerAppItem, ContainerAppModel } from "../../../tree/ContainerAppItem";
import { ScaleRuleGroupItem } from "../../../tree/scaling/ScaleRuleGroupItem";
import { createContainerAppsClient } from "../../../utils/azureClients";
import { localize } from "../../../utils/localize";
import { pickContainerApp } from "../../../utils/pickContainerApp";
import { AddScaleRuleStep } from "./AddScaleRuleStep";
import { IAddScaleRuleContext } from "./IAddScaleRuleContext";
import { ScaleRuleNameStep } from "./ScaleRuleNameStep";
import { ScaleRuleTypeStep } from "./ScaleRuleTypeStep";

const addScaleRuleTitle = localize('addScaleRuleTitle', 'Add Scale Rule');

export async function addScaleRule(context: IActionContext, node?: ScaleRuleGroupItem): Promise<void> {
    const { subscription, containerApp, revision } = node ?? await getContainerAppAndRevision(context);

    const scale = nonNullValue(revision?.template?.scale);
    const wizardContext: IAddScaleRuleContext = {
        ...context,
        ...createSubscriptionContext(subscription),
        scale,
        subscription,
        containerApp,
        scaleRules: scale.rules ?? [],
    };

    const wizard: AzureWizard<IAddScaleRuleContext> = new AzureWizard(wizardContext, {
        title: addScaleRuleTitle,
        promptSteps: [new ScaleRuleNameStep(), new ScaleRuleTypeStep()],
        executeSteps: [new AddScaleRuleStep()],
        showLoadingPrompt: true
    });

    await wizard.prompt();
    await wizard.execute();
    ext.state.notifyChildrenChanged(containerApp.managedEnvironmentId);
}

export async function getContainerAppAndRevision(context: IActionContext): Promise<{ containerApp: ContainerAppModel, revision: Revision, subscription: AzureSubscription }> {
    const containerAppItem = await pickContainerApp(context, {
        title: addScaleRuleTitle,
    });
    const revision = await pickRevision(context, containerAppItem);
    return { containerApp: containerAppItem.containerApp, revision, subscription: containerAppItem.subscription };
}

/**
 * If the container app is in single revision mode, returns the latest revision. Otherwise, prompts the user to pick a revision.
 */
async function pickRevision(context: IActionContext, node: ContainerAppItem): Promise<Revision> {
    const client: ContainerAppsAPIClient = await createContainerAppsClient(context, node.subscription);

    if (node.containerApp.revisionsMode === KnownActiveRevisionsMode.Single) {
        return await client.containerAppsRevisions.getRevision(node.containerApp.resourceGroup, node.containerApp.name, nonNullProp(node.containerApp, 'latestRevisionName'));
    } else {
        async function getPicks(): Promise<IAzureQuickPickItem<Revision>[]> {
            const revisions = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(node.containerApp.resourceGroup, node.containerApp.name));
            return revisions.map(r => ({
                label: nonNullProp(r, 'name'),
                data: r,
            }));
        }
        return (await context.ui.showQuickPick<IAzureQuickPickItem<Revision>>(getPicks(), {
            canPickMany: false,
            placeHolder: localize('selectRevision', 'Select revision'),
        })).data;
    }
}
