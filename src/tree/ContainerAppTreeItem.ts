/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, WebSiteManagementClient } from "@azure/arm-appservice";
import { ProgressLocation, window } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, DialogResponses, IActionContext, parseError, TreeItemIconPath } from "vscode-azureextensionui";
import { ext } from "../extensionVariables";
import { createWebSiteClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';

export class ContainerAppTreeItem extends AzExtTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'containerApp';
    public readonly contextValue: string = ContainerAppTreeItem.contextValue;
    public data: ContainerApp;
    public resourceGroupName: string;

    public name: string;
    public label: string;

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

    public async browse(): Promise<void> {
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
                if (pError.errorType !== '204') {
                    throw error;
                }
            }

            void window.showInformationMessage(deleteSucceeded);
            ext.outputChannel.appendLog(deleteSucceeded);
        });
    }


    // TODO: show provisioningState as description if not "succeeded"
    // TODO: Container settings
    // TODO: View container logs
}
