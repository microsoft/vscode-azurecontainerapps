/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, DialogResponses, IActionContext, ISubscriptionContext, nonNullProp, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { ProgressLocation, window } from "vscode";
import { getRevisionMode } from "../commands/containerApp/getRevisionMode";
import { azResourceContextValue, RevisionConstants } from "../constants";
import { ext } from "../extensionVariables";
import { DaprResource } from "../tree/DaprResource";
import { IngressResource } from "../tree/IngressResource";
import { LogsResource } from "../tree/LogsResource";
import { RevisionsResource } from "../tree/RevisionsResource";
import { ScaleResource } from "../tree/ScaleResource";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { deleteUtil } from "../utils/deleteUtil";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { ContainerAppsExtResourceBase } from "./ContainerAppsExtResourceBase";

export class ContainerAppResource extends ContainerAppsExtResourceBase<ContainerApp> {
    public static contextValue: string = 'containerApp';
    public managedEnvironmentId: string;
    public subscriptionContext: ISubscriptionContext;
    public name: string;
    public resourceGroupName: string;
    public data: ContainerApp;

    public resource: ContainerAppResource;
    public containerApp: ContainerAppResource;

    public constructor(ca: ContainerApp, subContext: ISubscriptionContext) {
        super();
        this.data = ca;
        this.subscriptionContext = subContext;

        this.id = nonNullProp(this.data, 'id');
        this.resourceGroupName = getResourceGroupFromId(this.id);

        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;
        this.managedEnvironmentId = nonNullProp(this.data, 'managedEnvironmentId');
        this.isParent = true;

        this.resource = this;
        this.containerApp = this;

        this.contextValuesToAdd.push(ContainerAppResource.contextValue, azResourceContextValue, `revisionmode:${getRevisionMode(this)}`);
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azure-containerapps');
    }

    public async getChildren(_context: IActionContext): Promise<ContainerAppsExtResourceBase<unknown>[]> {
        const children: ContainerAppsExtResourceBase<unknown>[] = [new DaprResource(this.data.configuration?.dapr, this, this.id)];
        if (getRevisionMode(this) === RevisionConstants.multiple.data) {
            children.push(new RevisionsResource(this, this.id));
        } else {
            children.push(new ScaleResource(this, this.data.template?.scale, this.id));
        }

        children.push(new IngressResource(this.data.configuration?.ingress, this, this.id));
        children.push(new LogsResource(this, this.id));

        return children;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        return await ext.branch.createAzExtTreeChildren((await this.getChildren(context)), this as unknown as AzExtParentTreeItem)
    }

    public async deleteTreeItemImpl(context: IActionContext & { suppressPrompt?: boolean }): Promise<void> {
        const confirmMessage: string = localize('confirmDeleteContainerApp', 'Are you sure you want to delete container app "{0}"?', this.name);
        if (!context.suppressPrompt) {
            await context.ui.showWarningMessage(confirmMessage, { modal: true, stepName: 'confirmDelete' }, DialogResponses.deleteResponse);
        }

        const deleting: string = localize('deletingContainerApp', 'Deleting container app "{0}"...', this.name);
        const deleteSucceeded: string = localize('deletedContainerApp', 'Successfully deleted container app "{0}".', this.name);

        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this.subscriptionContext]);
            await deleteUtil(async () => {
                await webClient.containerApps.beginDeleteAndWait(this.resourceGroupName, this.name);
            });

            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this.subscriptionContext]);
        const data = await client.containerApps.get(this.resourceGroupName, this.name);

        this.contextValuesToAdd.push(ContainerAppResource.contextValue, azResourceContextValue, `revisionmode:${getRevisionMode(this)}`);
        this.data = data;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public compareChildrenImpl(): number {
        return 0;
    }
}
