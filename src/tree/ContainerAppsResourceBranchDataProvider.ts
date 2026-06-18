/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { getResourceGroupFromId } from '@microsoft/vscode-azext-azureutils';
import { callWithTelemetryAndErrorHandling, nonNullValue, type IActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureResource, type AzureResourceBranchDataProvider } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { ContainerAppItem } from './ContainerAppItem';
import { type TreeElementBase } from './ContainerAppsBranchDataProvider';
import { CONTAINER_APP_NAMESPACE_FLAT } from './containerAppNamespace';

/**
 * Branch data provider for the host's standalone `AzExtResourceType.ContainerApps` group
 * (also used by the Resource Group grouping). Returns the **full** container-app subtree
 * rooted at a `ContainerAppItem`, mirroring the hierarchy that appears under the managed
 * environment. Tree-element ids are namespaced via `CONTAINER_APP_NAMESPACE_FLAT` so they
 * don't collide with the env-rooted copies, and `containerAppRegistry` is the dispatcher
 * that keeps the two copies in sync.
 */
export class ContainerAppsResourceBranchDataProvider extends vscode.Disposable implements AzureResourceBranchDataProvider<TreeElementBase> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeElementBase | undefined>();

    constructor() {
        super(() => this.onDidChangeTreeDataEmitter.dispose());
    }

    get onDidChangeTreeData(): vscode.Event<TreeElementBase | undefined> {
        return this.onDidChangeTreeDataEmitter.event;
    }

    async getResourceItem(element: AzureResource): Promise<TreeElementBase> {
        const item = await callWithTelemetryAndErrorHandling(
            'flatContainerApps.getResourceItem',
            async (context: IActionContext) => {
                context.errorHandling.rethrow = true;
                const containerApp = await ContainerAppItem.Get(
                    context,
                    element.subscription,
                    getResourceGroupFromId(element.id),
                    element.name,
                    CONTAINER_APP_NAMESPACE_FLAT);
                return new ContainerAppItem(element.subscription, containerApp);
            });

        return ext.state.wrapItemInStateHandling(nonNullValue(item) as TreeElementBase & { id: string }, x => this.refresh(x));
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
