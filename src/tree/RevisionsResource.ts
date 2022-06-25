/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ContainerAppsAPIClient, Revision } from "@azure/arm-appcontainers";
import { uiUtils } from "@microsoft/vscode-azext-azureutils";
import { IActionContext, TreeItemIconPath } from "@microsoft/vscode-azext-utils";
import { RevisionConstants } from "../constants";
import { ContainerAppChildResource } from "../resolver/ContainerAppChildResource";
import { ContainerAppResource } from "../resolver/ContainerAppResource";
import { ContainerAppsExtResourceBase } from "../resolver/ContainerAppsExtResourceBase";
import { createContainerAppsAPIClient } from "../utils/azureClients";
import { localize } from "../utils/localize";
import { treeUtils } from "../utils/treeUtils";
import { RevisionResource } from "./RevisionResource";

export class RevisionsResource extends ContainerAppChildResource<undefined> {
    public static contextValue: string = 'revisions';
    public readonly childTypeLabel: string = localize('revision', 'Revision');

    public name: string;
    public label: string;

    public idSuffix: string = 'revisions';

    private _revisons: Revision[];

    constructor(containerApp: ContainerAppResource, parentId: string) {
        super(containerApp);

        this.id = `${parentId}/${this.idSuffix}`
        this.label = localize('revisons', 'Revisions');
        this.contextValuesToAdd.push(RevisionsResource.contextValue);
        this.isParent = true;
    }

    public get iconPath(): TreeItemIconPath {
        return treeUtils.getIconPath('02885-icon-menu-Container-Revision-Active');
    }

    public get description(): string {
        return this.containerApp.data.configuration?.activeRevisionsMode?.toLowerCase() === 'single' ? RevisionConstants.single.label : RevisionConstants.multiple.label;
    }

    public async getChildren(context: IActionContext): Promise<ContainerAppsExtResourceBase<Revision>[]> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this.containerApp.subscriptionContext]);
        this._revisons = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.containerApp.resourceGroupName, this.containerApp.name));
        return this._revisons.map(re => new RevisionResource(re, this.containerApp));

    }

    public hasMoreChildrenImpl(): boolean {
        return false;
    }

    public async refreshImpl(context: IActionContext): Promise<void> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this.containerApp.subscriptionContext]);
        this._revisons = await uiUtils.listAllIterator(client.containerAppsRevisions.listRevisions(this.containerApp.resourceGroupName, this.containerApp.name));
    }

    public async getRevision(context: IActionContext, name: string): Promise<Revision> {
        const client: ContainerAppsAPIClient = await createContainerAppsAPIClient([context, this.containerApp.subscriptionContext]);
        return await client.containerAppsRevisions.getRevision(this.containerApp.resourceGroupName, this.containerApp.name, name);
    }
}
