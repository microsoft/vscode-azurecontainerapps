/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from '@azure/arm-appcontainers';
import { Environment } from '@azure/ms-rest-azure-env';
import { createTestActionContext, UserCancelledError } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType, type AzureResource, type AzureSubscription, type ResourceGroupsTreeDataProvider } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import { extensions, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { connectToGitHub } from '../src/commands/gitHub/connectToGitHub/connectToGitHub';
import { RevisionDraftFileSystem } from '../src/commands/revisionDraft/RevisionDraftFileSystem';
import { ext } from '../src/extensionVariables';
import { ContainerAppItem, type ContainerAppModel } from '../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../src/tree/ManagedEnvironmentItem';
import { ActionsItem } from '../src/tree/configurations/ActionsItem';
import { ConfigurationItem } from '../src/tree/configurations/ConfigurationItem';

suite('GitHub connection availability', () => {
    const subscription: AzureSubscription = {
        subscriptionId: 'subscription',
        tenantId: 'tenant',
        name: 'Test subscription',
        environment: Environment.AzureCloud,
        isCustomCloud: false,
        authentication: {
            getSession: () => undefined,
            getSessionWithScopes: () => undefined,
        },
    };
    const baseId = '/subscriptions/subscription/resourceGroups/group/providers/Microsoft.App';
    const app: ContainerAppModel = {
        id: `${baseId}/containerApps/app`,
        name: 'app',
        resourceGroup: 'group',
        location: 'eastus',
        managedEnvironmentId: `${baseId}/managedEnvironments/environment`,
        revisionsMode: KnownActiveRevisionsMode.Single,
        configuration: {},
    };
    let originalRgApi: typeof ext.rgApiV2;
    let originalFileSystem: typeof ext.revisionDraftFileSystem;
    let originalContext: typeof ext.context;

    setup(() => {
        originalRgApi = ext.rgApiV2;
        originalFileSystem = ext.revisionDraftFileSystem;
        originalContext = ext.context;
        const extension = extensions.getExtension('ms-azuretools.vscode-azurecontainerapps');
        assert.ok(extension);
        ext.context = { ...ext.context, extensionUri: extension.extensionUri };
        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
    });

    teardown(() => {
        ext.rgApiV2 = originalRgApi;
        ext.revisionDraftFileSystem = originalFileSystem;
        ext.context = originalContext;
    });

    function environment(name: string, environmentMode?: string): ManagedEnvironmentItem {
        const resource: AzureResource = {
            id: `${baseId}/managedEnvironments/${name}`,
            name, resourceGroup: 'group', subscription,
            azureResourceType: { type: 'microsoft.app/managedenvironments' },
            resourceType: AzExtResourceType.ContainerAppsEnvironment,
            raw: {},
        };
        return new ManagedEnvironmentItem(subscription, resource, {
            id: resource.id, name, resourceGroup: 'group', location: 'eastus', environmentMode,
        });
    }

    function setPickerHierarchy(environments: ManagedEnvironmentItem[], apps: ContainerAppItem[] = [], wrapped = false): void {
        const subscriptionNode = { subscription };
        const group = new TreeItem('Environments', TreeItemCollapsibleState.Collapsed);
        group.contextValue = 'azureResourceTypeGroup;ContainerAppsEnvironment';
        const nodes = environments.map(branchItem => wrapped ? { branchItem, unwrap: () => branchItem } : branchItem);
        const appNodes = apps.map(branchItem => wrapped ? { branchItem, unwrap: () => branchItem } : branchItem);
        const children = new Map<unknown, unknown[]>([
            [undefined, [subscriptionNode]], [subscriptionNode, [group]], [group, nodes],
            ...nodes.map<[unknown, unknown[]]>(node => [node, appNodes]),
        ]);
        const treeItems = new Map<unknown, TreeItem>([
            [subscriptionNode, new TreeItem(subscription.name, TreeItemCollapsibleState.Collapsed)],
            [group, group],
            ...nodes.map<[unknown, TreeItem]>((node, index) => [node, environments[index].getTreeItem()]),
            ...appNodes.map<[unknown, TreeItem]>((node, index) => [node, apps[index].getTreeItem()]),
        ]);
        const provider: ResourceGroupsTreeDataProvider = {
            getChildren: element => children.get(element) ?? [],
            getTreeItem: element => {
                const treeItem = treeItems.get(element);
                assert.ok(treeItem);
                return treeItem;
            },
        };
        ext.rgApiV2 = { ...originalRgApi, resources: { ...originalRgApi?.resources, azureResourceTreeDataProvider: provider } };
    }

    test('hides Actions on Express while preserving other configuration children', async () => {
        const standard = await new ConfigurationItem(subscription, app).getChildren();
        const express = await new ConfigurationItem(subscription, app, true).getChildren();
        assert.strictEqual(standard.filter(child => child instanceof ActionsItem).length, 1);
        assert.ok(express.every(child => !(child instanceof ActionsItem)));
        assert.deepStrictEqual(express.map(child => child.id), standard.filter(child => !(child instanceof ActionsItem)).map(child => child.id));
    });

    test('preserves the Standard Actions command arguments', async () => {
        const item = new ActionsItem(`${app.id}/Configurations`, 'containerApps', subscription, app);
        assert.deepStrictEqual(await item.getConnectToGitHubCommand(), {
            commandId: 'containerApps.connectToGitHub',
            commandArgs: [{ containerApp: app, subscription }],
        });
    });

    for (const revisionsMode of [KnownActiveRevisionsMode.Single, KnownActiveRevisionsMode.Multiple]) {
        test(`rejects a direct Express invocation in ${revisionsMode} mode before contacting Azure`, async () => {
            const item = new ContainerAppItem(subscription, { ...app, revisionsMode }, true);
            await assert.rejects(connectToGitHub(await createTestActionContext(), item), /not supported for Express Container Apps/);
        });

        test(`allows a direct Standard invocation in ${revisionsMode} mode to reach SourceControl lookup`, async () => {
            const failure = new Error('SourceControl authentication failed');
            const item = new ContainerAppItem({
                ...subscription,
                authentication: {
                    getSession: () => { throw failure; },
                    getSessionWithScopes: () => { throw failure; },
                },
            }, { ...app, revisionsMode });
            await assert.rejects(connectToGitHub(await createTestActionContext(), item), error => error === failure);
        });
    }

    test('propagates environment lookup failures for app-only arguments instead of assuming Standard', async () => {
        const failure = new Error('Environment authentication failed');
        const targetSubscription: AzureSubscription = {
            ...subscription,
            authentication: {
                getSession: () => { throw failure; },
                getSessionWithScopes: () => { throw failure; },
            },
        };
        await assert.rejects(connectToGitHub(await createTestActionContext(), {
            containerApp: app, subscription: targetSubscription,
        }), error => error === failure);
    });

    for (const wrapped of [false, true]) {
        test(`excludes Express environments and retains Standard and legacy ${wrapped ? 'wrapped' : 'bare'} models`, async () => {
            setPickerHierarchy([
                environment('unsupported', 'Express'),
                environment('standard', 'WorkloadProfiles'),
                environment('legacy'),
                environment('express', 'WorkloadProfiles'),
            ], [], wrapped);
            const context = await createTestActionContext();
            context.ui.showQuickPick = async picks => {
                assert.deepStrictEqual((await picks).map(pick => pick.label), ['standard', 'legacy', 'express']);
                throw new UserCancelledError();
            };
            await assert.rejects(connectToGitHub(context), UserCancelledError);
        });

        test(`does not fall back to excluded ${wrapped ? 'wrapped' : 'bare'} Express environments`, async () => {
            setPickerHierarchy([environment('unsupported', 'Express')], [], wrapped);
            const context = await createTestActionContext();
            context.ui.showQuickPick = async (picks, options) => {
                assert.deepStrictEqual(await picks, []);
                assert.strictEqual(options?.noPicksMessage, 'Current subscription has no Standard container apps environments');
                throw new UserCancelledError();
            };
            await assert.rejects(connectToGitHub(context), UserCancelledError);
        });

        test(`filters ${wrapped ? 'wrapped' : 'bare'} Express app picks without filtering by name`, async () => {
            setPickerHierarchy([environment('standard', 'WorkloadProfiles')], [
                new ContainerAppItem(subscription, { ...app, name: 'unsupported' }, true),
                new ContainerAppItem(subscription, { ...app, name: 'express' }),
            ], wrapped);
            const context = await createTestActionContext();
            let prompts = 0;
            context.ui.showQuickPick = async picks => {
                const choices = await picks;
                if (prompts++ === 0) {
                    assert.deepStrictEqual(choices.map(pick => pick.label), ['standard']);
                    return choices[0];
                }
                assert.deepStrictEqual(choices.map(pick => pick.label), ['express']);
                throw new UserCancelledError();
            };
            await assert.rejects(connectToGitHub(context), UserCancelledError);
        });

        test(`does not offer ${wrapped ? 'wrapped' : 'bare'} excluded apps as expandable ancestors`, async () => {
            setPickerHierarchy([environment('standard', 'WorkloadProfiles')], [
                new ContainerAppItem(subscription, app, true),
            ], wrapped);
            const context = await createTestActionContext();
            let prompts = 0;
            context.ui.showQuickPick = async (picks, options) => {
                const choices = await picks;
                if (prompts++ === 0) {
                    return choices[0];
                }
                assert.deepStrictEqual(choices, []);
                assert.strictEqual(options?.noPicksMessage, 'Selected container apps environment has no Standard apps');
                throw new UserCancelledError();
            };
            await assert.rejects(connectToGitHub(context), UserCancelledError);
        });
    }
});
