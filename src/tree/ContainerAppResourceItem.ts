/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { createContextValue } from '@microsoft/vscode-azext-utils';
import { type AzureResource, type AzureResourceBranchDataProvider, type AzureSubscription, type ViewPropertiesModel } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { createPortalUrl } from '../utils/createPortalUrl';
import { treeUtils } from '../utils/treeUtils';
import { type TreeElementBase } from './ContainerAppsBranchDataProvider';

/**
 * Flat tree item representing a Microsoft.App/containerApps resource shown under
 * the host's standalone "Container Apps" (`AzExtResourceType.ContainerApps`) group.
 *
 * The full container-app hierarchy lives under the `ContainerAppsEnvironment` group.
 * This item exists so the secondary group renders proper labels/icons and offers a
 * shortcut to the equivalent node in the environments hierarchy, instead of the
 * unhandled host stub that previously appeared as a bare leaf with no actions.
 */
export class ContainerAppResourceItem implements TreeElementBase {
    static readonly contextValue: string = 'containerAppResourceItem';
    static readonly contextValueRegExp: RegExp = new RegExp(ContainerAppResourceItem.contextValue);

    /**
     * Suffix appended to the underlying ARM id so this flat node has a tree id
     * distinct from the rich {@link ContainerAppItem} that also represents the
     * same Azure resource under the environments hierarchy. Without this, the
     * host's `revealAzureResource(<arm id>)` call could resolve to either node.
     */
    static readonly idSuffix: string = '#flat';

    readonly id: string;
    readonly viewProperties: ViewPropertiesModel;
    readonly portalUrl: vscode.Uri;

    constructor(public readonly subscription: AzureSubscription, public readonly resource: AzureResource) {
        this.id = `${resource.id}${ContainerAppResourceItem.idSuffix}`;
        this.portalUrl = createPortalUrl(subscription, resource.id);
        this.viewProperties = {
            data: resource.raw,
            label: resource.name,
        };
    }

    /** The ARM id of the underlying container app, without the flat-node id suffix. */
    get containerAppId(): string {
        return this.resource.id;
    }

    private get contextValue(): string {
        return createContextValue([ContainerAppResourceItem.contextValue, this.resource.name]);
    }

    getTreeItem(): vscode.TreeItem {
        return {
            id: this.id,
            label: this.resource.name,
            iconPath: treeUtils.getIconPath('azure-containerapps'),
            contextValue: this.contextValue,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
        };
    }

    getChildren(): TreeElementBase[] {
        return [];
    }

    static isContainerAppResourceItem(item: unknown): item is ContainerAppResourceItem {
        return typeof item === 'object' && item !== null &&
            typeof (item as ContainerAppResourceItem).contextValue === 'string' &&
            ContainerAppResourceItem.contextValueRegExp.test((item as ContainerAppResourceItem).contextValue);
    }
}

/**
 * Branch data provider for the host's standalone `AzExtResourceType.ContainerApps`
 * group. Returns a flat {@link ContainerAppResourceItem} per resource and exposes
 * no children -- the primary hierarchy is rooted at the managed environment.
 */
export class ContainerAppsResourceBranchDataProvider extends vscode.Disposable implements AzureResourceBranchDataProvider<TreeElementBase> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeElementBase | undefined>();

    constructor() {
        super(() => this.onDidChangeTreeDataEmitter.dispose());
    }

    get onDidChangeTreeData(): vscode.Event<TreeElementBase | undefined> {
        return this.onDidChangeTreeDataEmitter.event;
    }

    getResourceItem(element: AzureResource): TreeElementBase {
        const item = new ContainerAppResourceItem(element.subscription, element);
        return ext.state.wrapItemInStateHandling(item as TreeElementBase & { id: string }, () => this.refresh(item));
    }

    getChildren(element: TreeElementBase): vscode.ProviderResult<TreeElementBase[]> {
        return element.getChildren?.() ?? [];
    }

    async getTreeItem(element: TreeElementBase): Promise<vscode.TreeItem> {
        return await element.getTreeItem();
    }

    refresh(element?: TreeElementBase): void {
        this.onDidChangeTreeDataEmitter.fire(element);
    }
}
