/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerApp, ContainerAppsAPIClient, ContainerAppSecret } from "@azure/arm-app";
import { MarkdownString, ProgressLocation, window } from "vscode";
import { AzExtParentTreeItem, AzExtTreeItem, DialogResponses, IActionContext, parseError, TreeItemIconPath } from "vscode-azureextensionui";
import { RevisionConstants } from "../constants";
import { ext } from "../extensionVariables";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { getResourceGroupFromId } from "../utils/azureUtils";
import { localize } from "../utils/localize";
import { nonNullProp } from "../utils/nonNull";
import { openUrl } from "../utils/openUrl";
import { treeUtils } from "../utils/treeUtils";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { IngressDisabledTreeItem, IngressTreeItem } from "./IngressTreeItem";
import { LogsTreeItem } from "./LogsTreeItem";
import { RevisionsTreeItem } from "./RevisionsTreeItem";
import { RevisionTreeItem } from "./RevisionTreeItem";
import { ScaleTreeItem } from "./ScaleTreeItem";

export class ContainerAppTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = 'containerApp|azResource';
    public contextValue: string;
    public data: ContainerApp;
    public resourceGroupName: string;

    public name: string;
    public label: string;
    public managedEnvironmentId: string;

    public revisionsTreeItem: RevisionsTreeItem;

    constructor(parent: AzExtParentTreeItem, ca: ContainerApp) {
        super(parent);
        this.data = ca;

        this.id = nonNullProp(this.data, 'id');
        this.resourceGroupName = getResourceGroupFromId(this.id);

        this.name = nonNullProp(this.data, 'name');
        this.label = this.name;
        this.managedEnvironmentId = nonNullProp(this.data, 'managedEnvironmentId');

        this.contextValue = `${ContainerAppTreeItem.contextValue}|revisionmode:${this.getRevisionMode()}`;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('azure-containerapps');
    }

    public get description(): string | undefined {
        return this.data.provisioningState === 'Succeeded' ? undefined : this.data.provisioningState;
    }

    public async loadMoreChildrenImpl(_clearCache: boolean, _context: IActionContext): Promise<AzExtTreeItem[]> {
        // https://github.com/microsoft/vscode-azurecontainerapps/issues/55
        const children: AzExtTreeItem[] = [/* new DaprTreeItem(this, this.data.template?.dapr) */];
        if (this.getRevisionMode() === 'multiple') {
            this.revisionsTreeItem = new RevisionsTreeItem(this);
            children.push(this.revisionsTreeItem);
        }

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
        if (!this.data.latestRevisionFqdn) {
            throw new Error(localize('enableIngress', 'Enable ingress to perform this action.'));
        }

        await openUrl(`https://${this.data.latestRevisionFqdn}`);
    }

    public async deleteTreeItem(context: IActionContext, skipConfirmation: boolean = false): Promise<void> {
        await this.deleteTreeItemImpl(context, skipConfirmation);
    }

    public async deleteTreeItemImpl(context: IActionContext, skipConfirmation: boolean = false): Promise<void> {
        const confirmMessage: string = localize('confirmDeleteContainerApp', 'Are you sure you want to delete container app "{0}"?', this.name);
        if (!skipConfirmation) {
            await context.ui.showWarningMessage(confirmMessage, { modal: true, stepName: 'confirmDelete' }, DialogResponses.deleteResponse);
        }

        const deleting: string = localize('deletingContainerApp', 'Deleting container app "{0}"...', this.name);
        const deleteSucceeded: string = localize('deletedContainerApp', 'Successfully deleted container app "{0}".', this.name);

        await window.withProgress({ location: ProgressLocation.Notification, title: deleting }, async (): Promise<void> => {
            ext.outputChannel.appendLog(deleting);
            const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
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
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
        const data = await client.containerApps.get(this.resourceGroupName, this.name);

        this.contextValue = `${ContainerAppTreeItem.contextValue}|revisionmode:${this.getRevisionMode()}`;
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

        // https://github.com/Azure/azure-sdk-for-js/issues/21101
        // a 204 indicates no secrets, but sdk is catching it as an exception
        let secrets: ContainerAppSecret[] = [];
        try {
            const webClient: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this]);
            secrets = ((await webClient.containerApps.listSecrets(this.resourceGroupName, this.name)).value);
        } catch (error) {
            const pError = parseError(error);
            if (pError.errorType !== '204') {
                throw error;
            }
        }

        concreteContainerAppEnvelope.configuration.secrets = secrets;
        return concreteContainerAppEnvelope;
    }

    public getRevisionMode(): string {
        return this.data.configuration?.activeRevisionsMode?.toLowerCase() === 'single' ?
            RevisionConstants.single.data : RevisionConstants.multiple.data;
    }

    public async resolveTooltip(): Promise<MarkdownString> {
        return new MarkdownString(`
## ${this.name}

---

### Latest Revision
${this.data.latestRevisionName}

### Fully Qualified Domain Name
[${this.data.latestRevisionFqdn}](https://${this.data.latestRevisionFqdn})

### Traffic Weight
${JSON.stringify(this.data.configuration?.ingress?.traffic)}
        `)
    }
}

type Concrete<ContainerApp> = {
    [Property in keyof ContainerApp]-?: ContainerApp[Property];
}
