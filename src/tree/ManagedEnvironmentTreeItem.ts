/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ManagedEnvironment } from "@azure/arm-appcontainers";
import { AzExtParentTreeItem, AzExtTreeItem, IActionContext, ICreateChildImplContext } from "@microsoft/vscode-azext-utils";
import { IAzureResourceTreeItem } from './IAzureResourceTreeItem';
import { ResolvedContainerEnvironmentResource } from "./ResolvedContainerAppsResource";

export class ManagedEnvironmentTreeItem extends AzExtParentTreeItem implements IAzureResourceTreeItem {
    public static contextValue: string = ResolvedContainerEnvironmentResource.contextValue;
    public static contextValueRegExp: RegExp = ResolvedContainerEnvironmentResource.contextValueRegExp;
    public readonly contextValue: string;
    public readonly data: ManagedEnvironment;
    public readonly childTypeLabel: string;
    public resourceGroupName: string;

    public resolved: ResolvedContainerEnvironmentResource;

    public name: string;
    public label: string;

    constructor(parent: AzExtParentTreeItem, resolvedContainerAppsResource: ResolvedContainerEnvironmentResource) {
        super(parent);
        this.resolved = resolvedContainerAppsResource;
        this.data = this.resolved.data;

        this.resourceGroupName = this.resolved.resourceGroupName;
        this.name = this.resolved.name;
        this.label = this.resolved.label;
        this.contextValue = this.resolved.resolvedContextValue;
        this.childTypeLabel = this.resolved.childTypeLabel;
    }

    public get id(): string {
        return this.resolved.id;
    }

    public async loadMoreChildrenImpl(clearCache: boolean, context: IActionContext): Promise<AzExtTreeItem[]> {
        return await this.resolved.loadMoreChildrenImpl(clearCache, context);
    }

    public hasMoreChildrenImpl(): boolean {
        return this.resolved.hasMoreChildrenImpl();
    }

    public async createChildImpl(context: ICreateChildImplContext): Promise<AzExtTreeItem> {
        return this.resolved.createChildImpl(context);
    }

    public async deleteTreeItemImpl(context: IActionContext): Promise<void> {
        return await this.resolved.deleteTreeItemImpl(context);
    }
}
