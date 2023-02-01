/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { createGenericItem } from '../utils/GenericItem';
import { TreeElementBase } from './ContainerAppsBranchDataProvider';

interface TreeItemState {
    /**
     * Apply a temporary description to the tree item
     */
    temporaryDescription?: string;
    /**
     * Set the tree item icon to a spinner
     */
    spinner?: boolean;
    /**
     * Temporary children to be displayed
     */
    temporaryChildren?: TreeElementBase[];
}

type ResourceGroupsItem = TreeElementBase & { id: string };

export class TreeItemStateStore implements vscode.Disposable {
    private readonly store: Record<string, Partial<TreeItemState> | undefined> = {};
    private readonly disposables: vscode.Disposable[] = [];
    private readonly onDidUpdateStateEmitter = new vscode.EventEmitter<string>();
    private readonly onDidUpdateStateEvent: vscode.Event<string> = this.onDidUpdateStateEmitter.event;

    /**
     * Notify a resource that its children have changed.
     */
    notifyChildrenChanged(id: string): void {
        this.onDidUpdateStateEmitter.fire(id);
    }

    wrapItemInStateHandling(item: ResourceGroupsItem, refresh: (item: ResourceGroupsItem) => void): ResourceGroupsItem {
        const getTreeItem = item.getTreeItem.bind(item) as typeof item.getTreeItem;
        item.getTreeItem = async () => {
            const treeItem = await getTreeItem();
            if (item.id) {
                return this.applyToTreeItem({ ...treeItem, id: item.id });
            }
            return treeItem;
        }

        if (item.getChildren) {
            const getChildren = item.getChildren.bind(item) as typeof item.getChildren;
            item.getChildren = async () => {
                const children = await getChildren() ?? [];

                const state = this.getState(item.id);
                if (state.temporaryChildren) {
                    children.unshift(...state.temporaryChildren);
                }

                return children;
            }
        }

        this.onDidRequestRefresh(item.id, () => refresh(item));

        return item;
    }

    dispose(): void {
        this.disposables.forEach((disposable) => {
            disposable.dispose();
        });
    }

    async runWithTemporaryDescription<T = void>(id: string, description: string, callback: () => Promise<T>): Promise<T> {
        let result: T;
        this.update(id, { ...this.getState(id), temporaryDescription: description, spinner: true });
        try {
            result = await callback();
        } finally {
            this.update(id, { ...this.getState(id), temporaryDescription: undefined, spinner: false });
        }
        return result;
    }

    private async runWithTemporaryChildren<T = void>(id: string, child: TreeElementBase, callback: () => Promise<T>): Promise<T> {
        let result: T;
        this.update(id, { ...this.getState(id), temporaryChildren: [child] });
        try {
            result = await callback();
        } finally {
            this.update(id, { ...this.getState(id), temporaryChildren: undefined });
        }
        return result;
    }

    async showCreatingChild<T = void>(id: string, label: string, callback: () => Promise<T>): Promise<T> {
        return await this.runWithTemporaryChildren(id, createGenericItem({
            iconPath: new vscode.ThemeIcon('loading~spin'),
            label,
            contextValue: 'creatingChild',
        }), async () => {
            return await callback();
        });
    }

    private applyStateToTreeItem(state: Partial<TreeItemState>, treeItem: vscode.TreeItem): vscode.TreeItem {

        if (state.temporaryDescription) {
            treeItem.description = state.temporaryDescription;
        }

        if (state.spinner) {
            treeItem.iconPath = new vscode.ThemeIcon('loading~spin');
        }

        return treeItem;
    }

    private onDidRequestRefresh(id: string, callback: () => void): void {
        this.disposables.push(this.onDidUpdateStateEvent((eventId: string) => {
            if (eventId === id) {
                callback();
            }
        }));
    }

    private applyToTreeItem(treeItem: vscode.TreeItem & { id: string }): vscode.TreeItem {
        const state = this.getState(treeItem.id);
        return this.applyStateToTreeItem(state, { ...treeItem });
    }

    private getState(id: string): Partial<TreeItemState> {
        return this.store[id] ?? {};
    }

    private update(id: string, state: Partial<TreeItemState>): void {
        this.store[id] = { ...this.getState(id), ...state };
        this.onDidUpdateStateEmitter.fire(id);
    }
}
