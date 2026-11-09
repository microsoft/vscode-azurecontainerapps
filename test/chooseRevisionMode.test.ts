/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from '@azure/arm-appcontainers';
import { Environment } from '@azure/ms-rest-azure-env';
import { createTestActionContext, UserCancelledError, type AzureResourceQuickPickWizardContext } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType, type AzureResource, type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import { extensions, type TreeItem } from 'vscode';
import { chooseRevisionMode } from '../src/commands/revision/chooseRevisionMode/chooseRevisionMode';
import { RevisionDraftFileSystem } from '../src/commands/revisionDraft/RevisionDraftFileSystem';
import { ext } from '../src/extensionVariables';
import { ContainerAppItem } from '../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../src/tree/ManagedEnvironmentItem';
import { RevisionsItem } from '../src/tree/revisionManagement/RevisionsItem';
import { getPickContainerAppSteps } from '../src/utils/pickItem/pickContainerApp';
import { getTestApi } from './utils/testApiAccess';

suite('Choose revision mode', () => {
    const subscription: AzureSubscription = {
        subscriptionId: '00000000-0000-0000-0000-000000000000',
        tenantId: '00000000-0000-0000-0000-000000000000',
        name: 'Test subscription',
        environment: Environment.AzureCloud,
        isCustomCloud: false,
        authentication: {
            getSession: () => undefined,
            getSessionWithScopes: () => undefined,
        }
    };
    const baseId = `/subscriptions/${subscription.subscriptionId}/resourceGroups/test/providers/Microsoft.App`;
    let originalRgApi: typeof ext.rgApiV2;
    let originalFileSystem: typeof ext.revisionDraftFileSystem;
    let originalContext: typeof ext.context;
    let originalGetChildren: typeof ext.rgApiV2.resources.azureResourceTreeDataProvider.getChildren;
    let originalGetTreeItem: typeof ext.rgApiV2.resources.azureResourceTreeDataProvider.getTreeItem;

    suiteSetup(async () => {
        originalRgApi = ext.rgApiV2;
        originalFileSystem = ext.revisionDraftFileSystem;
        originalContext = ext.context;
        const extension = extensions.getExtension('ms-azuretools.vscode-azurecontainerapps');
        assert.ok(extension);
        ext.context = { ...ext.context, extensionUri: extension.extensionUri };
        ext.rgApiV2 = await (await getTestApi()).extensionVariables.getRgApiV2();
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        originalGetChildren = provider.getChildren;
        originalGetTreeItem = provider.getTreeItem;
        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
    });

    teardown(() => {
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        provider.getChildren = originalGetChildren;
        provider.getTreeItem = originalGetTreeItem;
    });

    suiteTeardown(() => {
        ext.rgApiV2 = originalRgApi;
        ext.revisionDraftFileSystem = originalFileSystem;
        ext.context = originalContext;
    });

    function environment(name: string, environmentMode?: string): ManagedEnvironmentItem {
        const resource: AzureResource = {
            id: `${baseId}/managedEnvironments/${name}`,
            name, resourceGroup: 'test',
            azureResourceType: { type: 'microsoft.app/managedenvironments' },
            resourceType: AzExtResourceType.ContainerAppsEnvironment,
            raw: {},
            subscription,
        };
        return new ManagedEnvironmentItem(subscription, resource, {
            id: resource.id, name, resourceGroup: 'test', location: 'eastus', environmentMode
        });
    }

    function app(isExpress: boolean, mode = KnownActiveRevisionsMode.Single): ContainerAppItem {
        return new ContainerAppItem(subscription, {
            id: `${baseId}/containerApps/test-app`,
            name: 'test-app', resourceGroup: 'test', location: 'eastus',
            managedEnvironmentId: `${baseId}/managedEnvironments/test-environment`,
            revisionsMode: mode,
            configuration: { activeRevisionsMode: mode },
            template: { containers: [] }
        }, isExpress);
    }

    async function environmentPicks(environments: ManagedEnvironmentItem[], excludeExpress?: boolean, wrapNodes = true): Promise<string[]> {
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        // The host normally supplies wrappers rather than bare branch items.
        const nodes = environments.map(branchItem => wrapNodes ? { id: branchItem.id, branchItem } : branchItem);
        const treeItems = new Map<unknown, TreeItem>(nodes.map((node, index) => [node, environments[index].getTreeItem()]));
        provider.getChildren = async () => nodes;
        provider.getTreeItem = element => {
            const treeItem = treeItems.get(element);
            assert.ok(treeItem);
            return treeItem;
        };
        const context: AzureResourceQuickPickWizardContext = { ...await createTestActionContext(), pickedNodes: [] };
        let labels: string[] = [];
        context.ui.showQuickPick = async items => {
            labels = (await items).map(item => item.label);
            throw new UserCancelledError();
        };

        const step = getPickContainerAppSteps({ excludeExpress })[2];
        await assert.rejects(step.prompt(context), UserCancelledError);
        return labels;
    }

    test('filters bare branch items as well as host wrappers', async () => {
        assert.deepStrictEqual(await environmentPicks([
            environment('unsupported', 'Express'),
            environment('express', 'WorkloadProfiles')
        ], true, false), ['express']);
    });

    test('excludes Express environments but preserves Standard and legacy environments', async () => {
        assert.deepStrictEqual(await environmentPicks([
            environment('unsupported', 'Express'),
            environment('standard', 'WorkloadProfiles'),
            environment('legacy'),
            environment('express', 'WorkloadProfiles')
        ], true), ['standard', 'legacy', 'express']);
    });

    test('does not offer excluded environments as ancestors in an Express-only subscription', async () => {
        assert.deepStrictEqual(await environmentPicks([environment('unsupported', 'Express')], true), []);
    });

    test('handles a subscription without environments', async () => {
        assert.deepStrictEqual(await environmentPicks([], true), []);
    });

    test('keeps Express environments selectable by other commands by default', async () => {
        assert.deepStrictEqual(await environmentPicks([environment('supported-here', 'Express')]), ['supported-here']);
    });

    test('rejects a directly supplied Express app before the revision-mode wizard', async () => {
        await assert.rejects(chooseRevisionMode(await createTestActionContext(), app(true)), /only support single revision mode/);
    });

    for (const mode of [KnownActiveRevisionsMode.Single, KnownActiveRevisionsMode.Multiple]) {
        test(`preserves the current ${mode} mode for a Standard app`, async () => {
            const context = await createTestActionContext();
            await context.ui.runWithInputs([mode], () => chooseRevisionMode(context, app(false, mode)));
        });
    }

    test('preserves the Revision Management entry point', async () => {
        const context = await createTestActionContext();
        const item = new RevisionsItem(subscription, app(false, KnownActiveRevisionsMode.Multiple).containerApp);
        await context.ui.runWithInputs(['Multiple'], () => chooseRevisionMode(context, item));
    });
});
