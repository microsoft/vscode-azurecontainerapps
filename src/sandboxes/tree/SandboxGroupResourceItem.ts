/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createContextValue } from '@microsoft/vscode-azext-utils';
import { type AzureResource, type AzureResourceBranchDataProvider, type AzureSubscription, type ViewPropertiesModel } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../../extensionVariables';
import { type TreeElementBase } from '../../tree/ContainerAppsBranchDataProvider';
import { createPortalUrl } from '../../utils/createPortalUrl';
import { localize } from '../../utils/localize';
import { parseSandboxGroupId, type AcaSandboxCli } from '../AcaSandboxCli';
import { type SandboxGroupRef } from '../acaSandboxTypes';
import { createAcaSandboxCli } from '../createAcaSandboxCli';
import { SandboxItem } from './SandboxItem';

/**
 * Tree item for a `Microsoft.App/sandboxGroups` resource shown first-class under the
 * subscription in the Azure Resources view. Its children are the individual sandboxes
 * within the group, listed via the `aca` CLI ({@link AcaSandboxCli}) — sandboxes are a
 * data-plane concept and are not returned by ARM, so they cannot be enumerated by the host.
 */
export class SandboxGroupResourceItem implements TreeElementBase {
    static readonly contextValue: string = 'sandboxGroupItem';

    readonly id: string;
    readonly ref: SandboxGroupRef;
    readonly viewProperties: ViewPropertiesModel;
    readonly portalUrl: vscode.Uri;

    constructor(
        public readonly cli: AcaSandboxCli,
        public readonly subscription: AzureSubscription,
        public readonly resource: AzureResource,
    ) {
        this.id = resource.id;
        this.ref = parseSandboxGroupId(resource.id) ?? {
            subscriptionId: subscription.subscriptionId,
            resourceGroup: resource.resourceGroup ?? '',
            groupName: resource.name,
        };
        this.portalUrl = createPortalUrl(subscription, resource.id);
        this.viewProperties = {
            data: resource.raw,
            label: resource.name,
        };
    }

    getTreeItem(): vscode.TreeItem {
        return {
            id: this.id,
            label: this.resource.name,
            iconPath: new vscode.ThemeIcon('symbol-namespace'),
            contextValue: createContextValue([SandboxGroupResourceItem.contextValue]),
            collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
            tooltip: new vscode.MarkdownString(
                localize('sandboxGroupTooltip', '**Sandbox group:** {0}\n\n**Resource group:** {1}\n\n**Location:** {2}',
                    this.resource.name,
                    this.ref.resourceGroup || '—',
                    this.resource.location || '—')),
        };
    }

    async getChildren(): Promise<TreeElementBase[]> {
        const sandboxes = await this.cli.listSandboxes(this.ref);
        return sandboxes.map(sandbox => new SandboxItem(this.cli, this.subscription, {
            ...this.ref,
            sandboxId: sandbox.id,
        }, sandbox));
    }
}

/**
 * Branch data provider that renders `Microsoft.App/sandboxGroups` resources (and their
 * sandbox children) under the Azure Resources view. Registered against
 * `AzExtResourceType.ContainerAppsSandboxGroups`.
 */
export class SandboxGroupBranchDataProvider extends vscode.Disposable implements AzureResourceBranchDataProvider<TreeElementBase> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeElementBase | undefined>();

    constructor() {
        super(() => this.onDidChangeTreeDataEmitter.dispose());
    }

    get onDidChangeTreeData(): vscode.Event<TreeElementBase | undefined> {
        return this.onDidChangeTreeDataEmitter.event;
    }

    getResourceItem(element: AzureResource): TreeElementBase {
        const item = new SandboxGroupResourceItem(createAcaSandboxCli(), element.subscription, element);
        return ext.state.wrapItemInStateHandling(item as TreeElementBase & { id: string }, () => this.refresh(item));
    }

    async getChildren(element: TreeElementBase): Promise<TreeElementBase[] | null | undefined> {
        return (await element.getChildren?.())?.map((child) => {
            if (child.id) {
                return ext.state.wrapItemInStateHandling(child as TreeElementBase & { id: string }, () => this.refresh(child));
            }
            return child;
        });
    }

    async getTreeItem(element: TreeElementBase): Promise<vscode.TreeItem> {
        return await element.getTreeItem();
    }

    refresh(element?: TreeElementBase): void {
        this.onDidChangeTreeDataEmitter.fire(element);
    }
}
