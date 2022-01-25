/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, Secret, WebSiteManagementClient } from "@azure/arm-appservice";
import { ProgressLocation, window } from "vscode";
import { AzExtParentTreeItem, AzExtRequestPrepareOptions, AzExtTreeItem, DialogResponses, IActionContext, parseError, sendRequestWithTimeout, TreeItemIconPath } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { DaprTreeItem } from "./DaprTreeItem";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { IngressDisabledTreeItem, IngressTreeItem } from "./IngressTreeItem";
import { LogsTreeItem } from "./LogsTreeItem";
import { RevisionsTreeItem } from "./RevisionsTreeItem";
import { RevisionTreeItem } from "./RevisionTreeItem";
import { ScaleTreeItem } from "./ScaleTreeItem";

export class ContainerAppTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'containerApp|azResource';
    public readonly contextValue: string = ContainerAppTreeItem.contextValue;
    public data: ContainerApp;
    public resourceGroupName: string;

    public name: string;
    public label: string;

    public revisionsTreeItem: RevisionsTreeItem;

    constructor(parent: AzExtParentTreeItem, ca: ContainerApp) {
        super(parent);
        this.data = ca;

        this.id = nonNullProp(this.data, 'id');
        this.resourceGroupName = getResourceGroupFromId(this.id);

        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azure-containerapps');
    }

    public get description(): string | undefined {
        return this.data.provisioningState === 'Succeeded' ? undefined : this.data.provisioningState;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        this.revisionsTreeItem = new RevisionsTreeItem(this);

        const children: AzExtTreeItem[] = [this.revisionsTreeItem, new DaprTreeItem(this, this.data.template?.dapr)];
        this.data.configuration?.ingress ? children.push(new IngressTreeItem(this, this.data.configuration?.ingress)) : children.push(new IngressDisabledTreeItem(this));
        children.push(new ScaleTreeItem(this, this.data.template?.scale), new LogsTreeItem(this))
        return children;
    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public compareChildrenImpl(): number {
        return 0;
    }

    public async browse(): Promise<void> {
        // make sure that ingress is enabled
        await openUrl(nonNullProp(this.data, 'latestRevisionFqdn'));
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        const confirmMessage: string = localize('confirmDeleteContainerApp', 'Are you sure you want to delete container app "{0}"?', this.name);
        await context.ui.showWarningMessage(confirmMessage, { modal: true, stepName: 'confirmDelete' }, DialogResponses.deleteResponse);

        const deleting: string = localize('deletingContainerApp', 'Deleting container app "{0}"...', this.name);
        const deleteSucceeded: string = localize('deletedContainerApp', 'Successfully deleted container app "{0}".', this.name);

        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const webClient: WebSiteManagementClient = await createWebSiteClient([context, this]);
            try {
                await webClient.containerApps.beginDeleteAndWait(this.resourceGroupName, this.name);
            } catch (error) {
                const pError = parseError(error);
                // a 204 indicates a success, but sdk is catching it as an exception
                // accept any 2xx reponse code
                if (Number(pError.errorType) < 200 || Number(pError.errorType) >= 300) {
                    throw error;
                }
            }

            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        const client: WebSiteManagementClient = await createWebSiteClient([context, this]);
        const data = await client.containerApps.get(this.resourceGroupName, this.name);

        this.revisionsTreeItem = new RevisionsTreeItem(this);
        this.data = data;
    }

    public pickTreeItemImpl(expectedContextValues: (string | RegExp)[]): AzExtTreeItem | undefined {
        for (const expectedContextValue of expectedContextValues) {
            switch (expectedContextValue) {
                case RevisionTreeItem.contextValue:
                case RevisionsTreeItem.contextValue:
                    return this.revisionsTreeItem;
                default:
            }
        }

        return undefined;
    }

    public async getContainerEnvelopeWithSecrets(context: IActionContext): Promise<Concrete<ContainerApp>> {
        // anytime you want to update the container app, you need to include the secrets but that is not retrieved by default
        // make a deep copy, we don't want to modify the one that is cached
        const containerAppEnvelope = <ContainerApp>JSON.parse(JSON.stringify(this.data));

        // verify all top-level properties
        for (const key of Object.keys(containerAppEnvelope)) {
            containerAppEnvelope[key] = nonNullProp(containerAppEnvelope, <keyof ContainerApp>key);
        }

        const concreteContainerAppEnvelope = <Concrete<ContainerApp>>containerAppEnvelope;
        const options: AzExtRequestPrepareOptions = {
            method: 'POST',
            queryParameters: { 'api-version': '2021-03-01' },
            pathTemplate: `${this.id}/listSecrets`,
        };

        const response = await sendRequestWithTimeout(context, options, 5000, this.subscription.credentials);
        // if 204, needs to be an empty []
        concreteContainerAppEnvelope.configuration.secrets = response.status === 204 ? [] : <Secret[]>response.parsedBody;
        return concreteContainerAppEnvelope;
    }
}

type Concrete<ContainerApp> = {
    [Property in keyof ContainerApp]-?: ContainerApp[Property];
}
