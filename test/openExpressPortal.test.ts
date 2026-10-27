/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from '@azure/arm-appcontainers';
import { type AzureResource, type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { Uri, type ExtensionContext } from 'vscode';
import { ext } from '../src/extensionVariables';
import { ContainerAppItem } from '../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../src/tree/ManagedEnvironmentItem';

suite('Open in Express Portal', () => {
    let originalContext: ExtensionContext;

    suiteSetup(() => {
        originalContext = ext.context;
        ext.context = { ...originalContext, extensionUri: Uri.file(path.join(__dirname, '..')) };
    });

    suiteTeardown(() => {
        ext.context = originalContext;
    });

    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    const menu = manifest.contributes.menus['view/item/context'].find(
        (item: { command: string }) => item.command === 'containerApps.openExpressPortal');
    const contextPatterns = Array.from(menu.when.matchAll(/viewItem =~ \/([^/]+)\/i/g),
        (match: RegExpMatchArray) => new RegExp(match[1], 'i'));
    const hasExpressMenu = (contextValue: string): boolean => contextPatterns.every(pattern => pattern.test(contextValue));

    for (const environmentMode of ['Express', 'Standard']) {
        test(`only shows the environment menu for Express mode: ${environmentMode}`, () => {
            const item = new ManagedEnvironmentItem(
                {} as AzureSubscription,
                {} as AzureResource,
                {
                    id: '/subscriptions/sub/resourceGroups/group/providers/Microsoft.App/managedEnvironments/environment-express',
                    name: 'environment-express',
                    location: 'westus',
                    resourceGroup: 'group',
                    environmentMode,
                });

            assert.strictEqual(hasExpressMenu(item.getTreeItem().contextValue ?? ''), environmentMode === 'Express');
        });
    }

    for (const isExpress of [true, false]) {
        test(`preserves the standard portal action and gates the Express action: express=${isExpress}`, () => {
            const subscription = {
                subscriptionId: 'sub',
                tenantId: 'tenant',
                environment: { portalUrl: 'https://portal.azure.com' },
            } as AzureSubscription;
            const item = new ContainerAppItem(subscription, {
                id: '/subscriptions/sub/resourceGroups/group/providers/Microsoft.App/containerApps/app',
                name: 'app',
                location: 'westus',
                resourceGroup: 'group',
                managedEnvironmentId: '/subscriptions/sub/resourceGroups/group/providers/Microsoft.App/managedEnvironments/environment',
                revisionsMode: KnownActiveRevisionsMode.Multiple,
            }, isExpress);
            item.hasUnsavedChanges = () => false;

            assert.strictEqual(hasExpressMenu(item.getTreeItem().contextValue ?? ''), isExpress);
            assert.strictEqual(item.portalUrl.authority, 'portal.azure.com');
        });
    }
});
