/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from '@azure/arm-appcontainers';
import { Environment } from '@azure/ms-rest-azure-env';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import { createContainerAppsPortalUrl } from '../src/commands/openContainerAppsPortal';
import { RevisionDraftFileSystem } from '../src/commands/revisionDraft/RevisionDraftFileSystem';
import { ext } from '../src/extensionVariables';
import { ContainerAppItem } from '../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../src/tree/ManagedEnvironmentItem';
import { createPortalUrl } from '../src/utils/createPortalUrl';

suite('Container Apps Portal navigation', () => {
    let originalFileSystem: RevisionDraftFileSystem;
    suiteSetup(() => {
        originalFileSystem = ext.revisionDraftFileSystem;
        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
    });
    suiteTeardown(() => {
        ext.revisionDraftFileSystem = originalFileSystem;
    });

    const subscription: AzureSubscription = {
        subscriptionId: '00000000-0000-0000-0000-000000000001',
        tenantId: '11111111-2222-3333-4444-555555555555',
        name: 'Test subscription',
        environment: Environment.AzureCloud,
        isCustomCloud: false,
        authentication: {
            getSession: () => { throw new Error('Portal links must not request authentication'); },
            getSessionWithScopes: () => { throw new Error('Portal links must not request authentication'); },
        },
    };

    function createAppItem(targetSubscription: AzureSubscription, isExpress: boolean): ContainerAppItem {
        const resourceGroup = 'portal-test-group';
        const name = 'portal-test-app';
        return new ContainerAppItem(targetSubscription, {
            id: `/subscriptions/${targetSubscription.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.App/containerApps/${name}`,
            name,
            location: 'eastus',
            resourceGroup,
            managedEnvironmentId: `/subscriptions/${targetSubscription.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.App/managedEnvironments/portal-test-env`,
            revisionsMode: KnownActiveRevisionsMode.Single,
        }, isExpress);
    }

    function createEnvironmentItem(targetSubscription: AzureSubscription, isExpress: boolean): ManagedEnvironmentItem {
        const resourceGroup = 'portal-test-group';
        const name = 'portal-test-env';
        const id = `/subscriptions/${targetSubscription.subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.App/managedEnvironments/${name}`;
        return new ManagedEnvironmentItem(targetSubscription, {
            id,
            name,
            subscription: targetSubscription,
            azureResourceType: { type: 'Microsoft.App/managedEnvironments' },
            raw: { id, name },
        }, {
            id,
            name,
            resourceGroup,
            location: 'eastus',
            environmentMode: isExpress ? 'Express' : 'WorkloadProfiles',
        });
    }

    for (const kind of ['app', 'environment'] as const) {
        const createItem = kind === 'app' ? createAppItem : createEnvironmentItem;
        const resourcePath = kind === 'app' ? 'apps' : 'environments';
        const resourceName = kind === 'app' ? 'portal-test-app' : 'portal-test-env';

        for (const isExpress of [false, true]) {
            test(`includes the selected tenant for ${isExpress ? 'an Express' : 'a Standard'} ${kind}`, () => {
                const url = new URL(createContainerAppsPortalUrl(createItem(subscription, isExpress)).toString(true));

                assert.strictEqual(url.origin, 'https://containerapps.azure.com');
                assert.strictEqual(url.pathname, `/${resourcePath}/${subscription.subscriptionId}/portal-test-group/${resourceName}/overview`);
                assert.strictEqual(url.searchParams.get('tenant'), subscription.tenantId);
                assert.strictEqual(url.hash, '');
            });
        }

        test(`uses the target subscription tenant when opening another account's ${kind}`, () => {
            const otherSubscription: AzureSubscription = {
                ...subscription,
                subscriptionId: '00000000-0000-0000-0000-000000000002',
                tenantId: '66666666-7777-8888-9999-000000000000',
            };
            const firstUrl = new URL(createContainerAppsPortalUrl(createItem(subscription, true)).toString(true));
            const otherUrl = new URL(createContainerAppsPortalUrl(createItem(otherSubscription, true)).toString(true));

            assert.strictEqual(firstUrl.searchParams.get('tenant'), subscription.tenantId);
            assert.strictEqual(otherUrl.searchParams.get('tenant'), otherSubscription.tenantId);
            assert.strictEqual(otherUrl.pathname, `/${resourcePath}/${otherSubscription.subscriptionId}/portal-test-group/${resourceName}/overview`);
        });
    }

    for (const environment of [Environment.AzureCloud, Environment.ChinaCloud, Environment.USGovernment]) {
        test(`preserves existing Azure Portal resource and console links in ${environment.name}`, () => {
            const node = createAppItem({ ...subscription, environment }, false);

            assert.strictEqual(node.portalUrl.toString(true), `${environment.portalUrl}/#@${subscription.tenantId}/resource${node.containerApp.id}`);
            assert.strictEqual(
                createPortalUrl(node.subscription, `${node.containerApp.id}/console`, { queryPrefix: 'feature.canary=true' }).toString(true),
                `${environment.portalUrl}/?feature.canary=true#@${subscription.tenantId}/resource${node.containerApp.id}/console`,
            );
        });
    }
});
