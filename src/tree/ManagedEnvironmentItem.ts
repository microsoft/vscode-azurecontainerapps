/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, ManagedEnvironment, Resource } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { callWithTelemetryAndErrorHandling, createSubscriptionContext, IActionContext, nonNullProp } from "@microsoft/vscode-azext-utils";
import { AzureResource, AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { EventEmitter, TreeItem, TreeItemCollapsibleState } from "vscode";
import { ext } from "../extensionVariables";
import { createContainerAppsAPIClient, createContainerAppsClient } from "../utils/azureClients";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppItem } from "./ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "./ContainerAppsBranchDataProvider";

type ManagedEnvironmentModel = ManagedEnvironment & ResourceModel;

const refreshContainerAppEnvironmentEmitter = new EventEmitter<string>();
const refreshContainerAppEnvironmentEvent = refreshContainerAppEnvironmentEmitter.event;

export function refreshContainerAppEnvironment(id: string): void {
    refreshContainerAppEnvironmentEmitter.fire(id);
}

export class ManagedEnvironmentItem implements TreeElementBase {

    public static contextValue: string = 'containerEnvironment';

    id: string;

    private resourceGroup: string;
    private name: string;

    public get managedEnvironment(): ManagedEnvironmentModel {
        return this._managedEnvironment;
    }

    constructor(public readonly subscription: AzureSubscription, public readonly resource: AzureResource, private _managedEnvironment: ManagedEnvironmentModel) {
        this.id = this.managedEnvironment.id;
        this.resourceGroup = this.managedEnvironment.resourceGroup;
        this.name = this.managedEnvironment.name;
        refreshContainerAppEnvironmentEvent((id) => {
            if (id === this.id) {
                void this.refresh();
            }
        })
    }

    private async refresh(): Promise<void> {
        await callWithTelemetryAndErrorHandling('containerAppItem.refresh', async (context) => {
            const client: ContainerAppsAPIClient = await createContainerAppsClient(context, this.subscription);
            this._managedEnvironment = ManagedEnvironmentItem.CreateManagedEnvironmentModel(await client.managedEnvironments.get(this.resourceGroup, this.name));
            ext.branchDataProvider.refresh(this);
        });
    }

    async getChildren(): Promise<ContainerAppsItem[]> {

        const result = await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const containerApps = await ContainerAppItem.List(context, this.subscription, this.id);
            return containerApps.map(ca => new ContainerAppItem(this.subscription, ca));
        });

        return result ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            label: this.managedEnvironment.name,
            id: this.id,
            iconPath: treeUtils.getIconPath('managedEnvironment'),
            contextValue: ManagedEnvironmentItem.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    static async List(context: IActionContext, subscription: AzureSubscription): Promise<ManagedEnvironment[]> {
        const subContext = createSubscriptionContext(subscription);
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, subContext]);
        return await uiUtils.listAllIterator(client.managedEnvironments.listBySubscription());
    }

    static async Get(context: IActionContext, subscription: AzureSubscription, resourceGroup: string, name: string): Promise<ManagedEnvironmentModel> {
        const subContext = createSubscriptionContext(subscription);
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, subContext]);
        return ManagedEnvironmentItem.CreateManagedEnvironmentModel(await client.managedEnvironments.get(resourceGroup, name));
    }

    private static CreateManagedEnvironmentModel(managedEnvironment: ManagedEnvironment): ManagedEnvironmentModel {
        return createAzureResourceModel(managedEnvironment);
    }
}

interface ResourceModel extends Resource {
    id: string;
    name: string;
    resourceGroup: string;
}

function createAzureResourceModel<T extends Resource>(resource: T): T & ResourceModel {
    const id = nonNullProp(resource, 'id');
    return {
        id,
        name: nonNullProp(resource, 'name'),
        resourceGroup: getResourceGroupFromId(id),
        ...resource,
    }
}
