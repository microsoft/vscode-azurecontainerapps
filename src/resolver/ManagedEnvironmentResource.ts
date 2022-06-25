/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ManagedEnvironment } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { AzExtParentTreeItem, AzExtTreeItem, AzureWizard, IActionContext, ISubscriptionContext, nonNullProp, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ManagedEnvironmentDeleteStep } from "../commands/containerApp/delete/ContainerAppDeleteStep";
import { IDeleteWizardContext } from "../commands/IDeleteWizardContext";
import { PromptDeleteStep } from "../commands/managedEnvironments/delete/PromptDeleteStep";
import { azResourceContextValue } from "../constants";
import { ext } from "../extensionVariables";
import { createActivityContext } from "../utils/activityUtils";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppResource } from "./ContainerAppResource";
import { ContainerAppsExtResourceBase } from "./ContainerAppsExtResourceBase";

export class ManagedEnvironmentResource extends ContainerAppsExtResourceBase<ManagedEnvironment> {
    public static contextValue: string = 'managedEnvironment';
    public static contextValueRegExp: RegExp = new RegExp(ManagedEnvironmentResource.contextValue);
    public data: ManagedEnvironment;

    public managedEnvironmentId: string;

    public subscriptionContext: ISubscriptionContext;
    public name: string;
    public resourceGroupName: string;

    public constructor(me: ManagedEnvironment, subContext: ISubscriptionContext) {
        super();
        this.data = me;
        this.id = nonNullProp(this.data, 'id');
        this.subscriptionContext = subContext;

        this.resourceGroupName = getResourceGroupFromId(this.id);
        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;

        this.contextValuesToAdd.push(ManagedEnvironmentResource.contextValue, azResourceContextValue);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('Container App Environments placeholder icon icon');
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this.subscriptionContext]);
        // could be more efficient to call this once at Subscription level, and filter based off that but then risk stale data
        const containerApps: ContainerApp[] = (await uiUtils.listAllIterator(client.containerApps.listBySubscription()))
            .filter(ca => ca.managedEnvironmentId && ca.managedEnvironmentId === this.id);

        const children = containerApps.map(ca => new ContainerAppResource(ca, this.subscriptionContext));
        return await ext.branch.createAzExtTreeChildren(children, this as unknown as AzExtParentTreeItem)

    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        const wizardContext: IDeleteWizardContext = {
            ...context,
            node: this,
            subscription: this.subscriptionContext,
            ...(await createActivityContext())
        };

        const wizard = new AzureWizard<IDeleteWizardContext>(wizardContext, {
            title: localize('deleteEnv', 'Delete Container Apps environment "{0}"', this.name),
            promptSteps: [new PromptDeleteStep()],
            executeSteps: [new ManagedEnvironmentDeleteStep()]
        });

        await wizard.prompt();
        await wizard.execute();
    }
}

