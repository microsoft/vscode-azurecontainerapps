/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, ManagedEnvironment, Resource } from "@azure/arm-appcontainers";
import { getResourceGroupFromId, uiUtils } from "@microsoft/vscode-azext-azureutils";
import { IActionContext, callWithTelemetryAndErrorHandling, createContextValue, createSubscriptionContext, nonNullProp, nonNullValueAndProp } from "@microsoft/vscode-azext-utils";
import { AzureResource, AzureSubscription } from "@microsoft/vscode-azureresources-api";
import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppItem } from "./ContainerAppItem";
import { ContainerAppsItem, TreeElementBase } from "./ContainerAppsBranchDataProvider";

type ManagedEnvironmentModel = ManagedEnvironment & ResourceModel;

export class ManagedEnvironmentItem implements TreeElementBase {
    static readonly contextValue: string = 'managedEnvironmentItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ManagedEnvironmentItem.contextValue);

    id: string;

    constructor(public readonly subscription: AzureSubscription, public readonly resource: AzureResource, public readonly managedEnvironment: ManagedEnvironmentModel) {
        this.id = managedEnvironment.id;
    }

    private get contextValue(): string {
        const values: string[] = [];

        // Enable more granular tree item filtering by environment name
        values.push(nonNullValueAndProp(this.managedEnvironment, 'name'));

        values.push(ManagedEnvironmentItem.contextValue);
        return createContextValue(values);
    }

    async getChildren(): Promise<ContainerAppsItem[]> {
        const result = await callWithTelemetryAndErrorHandling('getChildren', async (context) => {
            const containerApps = await ContainerAppItem.List(context, this.subscription, this.id);
            return containerApps
                .map(ca => new ContainerAppItem(this.subscription, ca))
                .sort((a, b) => treeUtils.sortById(a, b));
        });

        return result ?? [];
    }

    getTreeItem(): TreeItem {
        return {
            label: this.managedEnvironment.name,
            id: this.id,
            iconPath: treeUtils.getIconPath('managed-environment'),
            contextValue: this.contextValue,
            collapsibleState: TreeItemCollapsibleState.Collapsed,
        }
    }

    static isManagedEnvironmentItem(item: unknown): item is ManagedEnvironmentItem {
        return typeof item === 'object' &&
            typeof (item as ManagedEnvironmentItem).contextValue === 'string' &&
            ManagedEnvironmentItem.contextValueRegExp.test((item as ManagedEnvironmentItem).contextValue);
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
