/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.txt in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { AzExtServiceClientCredentials, callWithTelemetryAndErrorHandling, IActionContext, ISubscriptionContext, nonNullProp } from '@microsoft/vscode-azext-utils';
import { AzureResource, AzureResourceBranchDataProvider, AzureSubscription, ResourceModelBase, ViewPropertiesModel } from '@microsoft/vscode-azureresources-api';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { localize } from '../utils/localize';
import { ContainerAppModel } from './ContainerAppItem';
import { ManagedEnvironmentItem } from './ManagedEnvironmentItem';

export interface TreeElementBase extends ResourceModelBase {
    getChildren?(): vscode.ProviderResult<TreeElementBase[]>;
    getTreeItem(): vscode.TreeItem | Thenable<vscode.TreeItem>;

    viewProperties?: ViewPropertiesModel;
}

export interface ContainerAppsItem extends TreeElementBase {
    subscription: AzureSubscription;
    containerApp: ContainerAppModel;
}

export class ContainerAppsBranchDataProvider extends vscode.Disposable implements AzureResourceBranchDataProvider<TreeElementBase> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<TreeElementBase | undefined>();

    constructor() {
        super(
            () => {
                this.onDidChangeTreeDataEmitter.dispose();
            });
    }

    get onDidChangeTreeData(): vscode.Event<TreeElementBase | undefined> {
        return this.onDidChangeTreeDataEmitter.event;
    }

    async getChildren(element: TreeElementBase): Promise<TreeElementBase[] | null | undefined> {
        return (await element.getChildren?.())?.map((child) => {
            if (child.id) {
                return ext.state.wrapItemInStateHandling(child as TreeElementBase & { id: string }, () => this.refresh(child))
            }
            return child;
        });
    }

    async getResourceItem(element: AzureResource): Promise<TreeElementBase> {
        const resourceItem = await callWithTelemetryAndErrorHandling(
            'getResourceItem',
            async (context: IActionContext) => {
                const managedEnvironment = await ManagedEnvironmentItem.Get(context, element.subscription, nonNullProp(element, 'resourceGroup'), element.name);
                return new ManagedEnvironmentItem(element.subscription, element, managedEnvironment);
            });

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return ext.state.wrapItemInStateHandling(resourceItem!, () => this.refresh(resourceItem));
    }

    async getTreeItem(element: TreeElementBase): Promise<vscode.TreeItem> {
        const ti = await element.getTreeItem();
        return ti;
    }

    refresh(element?: TreeElementBase): void {
        this.onDidChangeTreeDataEmitter.fire(element);
    }
}

export const branchDataProvider = new ContainerAppsBranchDataProvider();


/**
 * Converts a VS Code authentication session to an Azure Track 1 & 2 compatible compatible credential.
 */
export function createCredential(getSession: (scopes?: string[]) => vscode.ProviderResult<vscode.AuthenticationSession>): AzExtServiceClientCredentials {
    return {
        getToken: async (scopes?: string | string[]) => {
            if (typeof scopes === 'string') {
                scopes = [scopes];
            }

            const session = await getSession(scopes);

            if (session) {
                return {
                    token: session.accessToken
                };
            } else {
                return null;
            }
        },
        signRequest: async () => {
            throw new Error((localize('signRequestError', 'Track 1 credentials are not (currently) supported.')));
        }
    };
}

/**
 * Creates a subscription context from an application subscription.
 */
export function createSubscriptionContext(subscription: AzureSubscription): ISubscriptionContext {
    return {
        subscriptionDisplayName: '',
        subscriptionPath: '',
        userId: '',
        ...subscription,
        credentials: createCredential(subscription.authentication.getSession)
    };
}
