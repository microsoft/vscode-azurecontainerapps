/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Environment } from '@azure/ms-rest-azure-env';
import { AzExtResourceType, type AzureResource, type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import { TreeItemCollapsibleState, Uri, type ExtensionContext } from 'vscode';
import { ext } from '../src/extensionVariables';
import { ManagedEnvironmentItem } from '../src/tree/ManagedEnvironmentItem';

suite('managed environment tree items', () => {
    let originalContext: ExtensionContext;

    suiteSetup(() => {
        originalContext = ext.context;
        ext.context = { ...ext.context, extensionUri: Uri.joinPath(Uri.file(__dirname), '..') };
    });

    suiteTeardown(() => {
        ext.context = originalContext;
    });

    const subscription: AzureSubscription = {
        subscriptionId: 'subscription',
        tenantId: 'tenant',
        name: 'subscription',
        environment: Environment.AzureCloud,
        isCustomCloud: false,
        authentication: {
            getSession: async () => undefined,
            getSessionWithScopes: async () => undefined,
        },
    };
    const name = 'environment';
    const resourceGroup = 'resource-group';
    const id = `/subscriptions/subscription/resourceGroups/${resourceGroup}/providers/Microsoft.App/managedEnvironments/${name}`;
    const resource: AzureResource = {
        id,
        name,
        resourceGroup,
        subscription,
        azureResourceType: { type: 'microsoft.app/managedenvironments' },
        resourceType: AzExtResourceType.ContainerAppsEnvironment,
        raw: {},
    };

    for (const environmentMode of ['Express', 'Standard', undefined]) {
        test(`labels ${environmentMode ?? 'legacy Standard'} environments without changing tree identity`, () => {
            const managedEnvironment = { id, name, resourceGroup, location: 'eastus', environmentMode };
            const item = new ManagedEnvironmentItem(subscription, resource, managedEnvironment);
            const treeItem = item.getTreeItem();
            const isExpress = environmentMode === 'Express';

            assert.strictEqual(treeItem.description, isExpress ? '(Express)' : '(Standard)');
            assert.strictEqual(item.isExpress, isExpress);
            assert.strictEqual(treeItem.label, name);
            assert.strictEqual(treeItem.id, id);
            assert.strictEqual(treeItem.collapsibleState, TreeItemCollapsibleState.Collapsed);
            assert.match(treeItem.contextValue ?? '', ManagedEnvironmentItem.contextValueRegExp);
            assert.deepStrictEqual(item.viewProperties, { data: managedEnvironment, label: name });
        });
    }
});
