/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode } from '@azure/arm-appcontainers';
import { Environment } from '@azure/ms-rest-azure-env';
import { createTestActionContext, UserCancelledError, type AzureResourceQuickPickWizardContext, type AzureWizardPromptStep } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType, type AzureResource, type AzureSubscription, type ResourceModelBase } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import { extensions, type TreeItem } from 'vscode';
import { chooseRevisionMode } from '../src/commands/revision/chooseRevisionMode/chooseRevisionMode';
import { RevisionDraftFileSystem } from '../src/commands/revisionDraft/RevisionDraftFileSystem';
import { ext } from '../src/extensionVariables';
import { ContainerAppItem } from '../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../src/tree/ManagedEnvironmentItem';
import { RevisionsItem } from '../src/tree/revisionManagement/RevisionsItem';
import { RevisionItem } from '../src/tree/revisionManagement/RevisionItem';
import { getPickContainerAppStep, getPickContainerAppSteps, pickContainerApp, pickContainerAppWithoutPrompt } from '../src/utils/pickItem/pickContainerApp';
import { getPickEnvironmentSteps, pickEnvironment } from '../src/utils/pickItem/pickEnvironment';
import { type ContainerAppPickItemOptions } from '../src/utils/pickItem/PickItemOptions';
import { pickRevision } from '../src/utils/pickItem/pickRevision';
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
    const revisionModePickOptions: ContainerAppPickItemOptions = {
        environmentOptions: {
            filter: (_treeItem, element) => {
                const item: unknown = (element as { branchItem?: ResourceModelBase })?.branchItem ?? element;
                return !ManagedEnvironmentItem.isManagedEnvironmentItem(item) || !item.isExpress;
            },
            noPicksMessage: 'No Standard environments',
        },
    };
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

    function app(isExpress: boolean, mode = KnownActiveRevisionsMode.Single, name = 'test-app'): ContainerAppItem {
        return new ContainerAppItem(subscription, {
            id: `${baseId}/containerApps/${name}`,
            name, resourceGroup: 'test', location: 'eastus',
            managedEnvironmentId: `${baseId}/managedEnvironments/test-environment`,
            environmentId: `${baseId}/managedEnvironments/test-environment`,
            revisionsMode: mode,
            configuration: { activeRevisionsMode: mode },
            template: { containers: [] }
        }, isExpress);
    }

    async function pickerPicks(items: (ManagedEnvironmentItem | ContainerAppItem)[], options?: ContainerAppPickItemOptions, stepIndex = 2, wrapNodes = true): Promise<{ labels: string[]; noPicksMessage?: string }> {
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        // The host normally supplies wrappers rather than bare branch items.
        const nodes = items.map(branchItem => wrapNodes ? { id: branchItem.id, branchItem } : branchItem);
        const treeItems = new Map<unknown, TreeItem>(nodes.map((node, index) => [node, items[index].getTreeItem()]));
        provider.getChildren = async () => nodes;
        provider.getTreeItem = element => {
            const treeItem = treeItems.get(element);
            assert.ok(treeItem);
            return treeItem;
        };
        const context: AzureResourceQuickPickWizardContext = { ...await createTestActionContext(), pickedNodes: [] };
        let labels: string[] = [];
        let noPicksMessage: string | undefined;
        context.ui.showQuickPick = async (items, promptOptions) => {
            labels = (await items).map(item => item.label);
            noPicksMessage = promptOptions?.noPicksMessage;
            throw new UserCancelledError();
        };

        const step = getPickContainerAppSteps(options)[stepIndex];
        await assert.rejects(step.prompt(context), UserCancelledError);
        return { labels, noPicksMessage };
    }

    async function environmentPicks(environments: ManagedEnvironmentItem[], options?: ContainerAppPickItemOptions, wrapNodes = true): Promise<string[]> {
        return (await pickerPicks(environments, options, 2, wrapNodes)).labels;
    }

    test('filters bare branch items as well as host wrappers', async () => {
        assert.deepStrictEqual(await environmentPicks([
            environment('unsupported', 'Express'),
            environment('express', 'WorkloadProfiles')
        ], revisionModePickOptions, false), ['express']);
    });

    test('excludes Express environments but preserves Standard and legacy environments', async () => {
        assert.deepStrictEqual(await environmentPicks([
            environment('unsupported', 'Express'),
            environment('standard', 'WorkloadProfiles'),
            environment('legacy'),
            environment('express', 'WorkloadProfiles')
        ], revisionModePickOptions), ['standard', 'legacy', 'express']);
    });

    test('does not offer excluded environments as ancestors in an Express-only subscription', async () => {
        assert.deepStrictEqual(await environmentPicks([environment('unsupported', 'Express')], revisionModePickOptions), []);
    });

    test('handles a subscription without environments', async () => {
        assert.deepStrictEqual(await environmentPicks([], revisionModePickOptions), []);
    });

    test('keeps Express environments selectable by other commands by default', async () => {
        assert.deepStrictEqual(await environmentPicks([environment('supported-here', 'Express')]), ['supported-here']);
    });

    test('passes the original tree item and element to a generic environment filter', async () => {
        const included = environment('included');
        const excluded = environment('excluded');
        assert.deepStrictEqual(await environmentPicks([included, excluded], {
            environmentOptions: {
                filter: (treeItem, element) => {
                    assert.ok(element instanceof ManagedEnvironmentItem);
                    assert.ok(element === included || element === excluded);
                    assert.strictEqual(treeItem.id, element.id);
                    return element === included;
                },
            },
        }, false), ['included']);
    });

    for (const noPicksMessage of [undefined, 'No environments match this filter']) {
        test(`uses the ${noPicksMessage ? 'custom' : 'default'} environment no-picks message`, async () => {
            assert.deepStrictEqual(await pickerPicks([environment('excluded')], {
                environmentOptions: { filter: () => false, noPicksMessage },
            }), {
                labels: [],
                noPicksMessage: noPicksMessage ?? 'Current subscription has no container apps environments',
            });
        });
    }

    test('does not apply app filters or messages to the environment picker', async () => {
        const result = await pickerPicks([environment('standard')], {
            filter: () => { throw new Error('App filter must not run for environments'); },
            noPicksMessage: 'No matching apps',
        });
        assert.deepStrictEqual(result, {
            labels: ['standard'],
            noPicksMessage: 'Current subscription has no container apps environments',
        });
    });

    test('applies app filters and messages without applying environment options to apps', async () => {
        const standard = app(false);
        const express = app(true);
        const result = await pickerPicks([express, standard], {
            filter: (treeItem, element) => {
                assert.ok(element instanceof ContainerAppItem);
                assert.ok(element === standard || element === express);
                assert.strictEqual(treeItem.id, element.id);
                return element === standard;
            },
            noPicksMessage: 'No matching apps',
            environmentOptions: { filter: () => { throw new Error('Environment filter must not run for apps'); } },
        }, 3, false);
        assert.deepStrictEqual(result, { labels: ['test-app'], noPicksMessage: 'No matching apps' });
    });

    test('applies app filters to expandable ancestor fallbacks', async () => {
        assert.deepStrictEqual(await pickerPicks([app(true)], {
            filter: () => false,
            noPicksMessage: 'No matching apps',
        }, 3), { labels: [], noPicksMessage: 'No matching apps' });
    });

    test('does not auto-select a named environment rejected by its filter', async () => {
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        const excluded = environment('excluded');
        provider.getChildren = async () => [excluded];
        provider.getTreeItem = () => excluded.getTreeItem();
        const context: AzureResourceQuickPickWizardContext = { ...await createTestActionContext(), pickedNodes: [] };
        context.ui.showQuickPick = async items => {
            assert.deepStrictEqual(await items, []);
            throw new UserCancelledError();
        };
        const step = getPickEnvironmentSteps(true, undefined, 'excluded', { filter: () => false })[2];
        await assert.rejects(step.prompt(context), UserCancelledError);
        assert.deepStrictEqual(context.pickedNodes, []);
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

    function installHierarchy(environments: ManagedEnvironmentItem[], apps: ContainerAppItem[], wrapped = false) {
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        const subscriptionNode = { subscription };
        const group = {};
        const children = new Map<object | undefined, object[]>([
            [undefined, [subscriptionNode]], [subscriptionNode, [group]], [group, environments],
        ]);
        const treeItems = new Map<object, () => TreeItem>([
            [subscriptionNode, () => ({ label: subscription.name, collapsibleState: 1 })],
            [group, () => ({ label: 'Environments', contextValue: 'azureResourceTypeGroup;ContainerAppsEnvironment', collapsibleState: 1 })],
        ]);
        const wrappers = new Map<object, object>();
        const originals = new Map<object, object>();
        const visited: (object | undefined)[] = [];
        function add(parent: object, items: { getTreeItem(): TreeItem }[]): void {
            children.set(parent, items);
            for (const item of items) {
                treeItems.set(item, () => item.getTreeItem());
            }
        }
        add(group, environments);
        for (const environment of environments) {
            add(environment, apps);
        }
        provider.getChildren = async function (element) {
            assert.strictEqual(this, provider, 'Discovery uses the original tree provider');
            assert.ok(element === undefined || (typeof element === 'object' && element !== null));
            const parent = element ? originals.get(element) ?? element : undefined;
            visited.push(parent);
            return (children.get(parent) ?? []).map(item => {
                if (!wrapped) {
                    return item;
                }
                let wrapper = wrappers.get(item);
                if (!wrapper) {
                    wrapper = { branchItem: item, unwrap: () => item };
                    wrappers.set(item, wrapper);
                    originals.set(wrapper, item);
                }
                // Subscription steps read subscription from the host node.
                return item === subscriptionNode ? item : wrapper;
            });
        };
        provider.getTreeItem = function (element) {
            assert.strictEqual(this, provider, 'Tree rendering uses the original tree provider');
            assert.ok(typeof element === 'object' && element !== null);
            const getTreeItem = treeItems.get(originals.get(element) ?? element);
            assert.ok(getTreeItem);
            return getTreeItem();
        };
        return { add, visited };
    }

    for (const environmentMode of [undefined, 'WorkloadProfiles', 'Express']) {
        for (const wrapped of [false, true]) {
            test(`preserves the full unfiltered ${environmentMode ?? 'legacy'} app picker with ${wrapped ? 'wrapped' : 'bare'} nodes`, async () => {
                const parent = environment('test-environment', environmentMode);
                const expected = app(environmentMode === 'Express');
                const { visited } = installHierarchy([parent], [expected], wrapped);
                const context = await createTestActionContext();
                const result = await context.ui.runWithInputs(['test-environment', 'test-app'], () =>
                    pickContainerApp(context, { title: 'Unfiltered command', showLoadingPrompt: false }));
                assert.strictEqual(result, expected);
                assert.ok(visited.includes(parent), 'App discovery starts at the selected environment');
            });
        }

        test(`preserves named no-prompt selection for ${environmentMode ?? 'legacy'} resources`, async () => {
            const parent = environment('test-environment', environmentMode);
            const expected = app(environmentMode === 'Express');
            installHierarchy([parent], [expected]);
            assert.strictEqual(await pickContainerAppWithoutPrompt({
                ...await createTestActionContext(), subscriptionId: subscription.subscriptionId,
            }, expected.containerApp, { showLoadingPrompt: false }), expected);
        });
    }

    test('preserves unfiltered environment selection with command title options', async () => {
        const expected = environment('test-environment', 'Express');
        installHierarchy([expected], []);
        const context = await createTestActionContext();
        assert.strictEqual(await context.ui.runWithInputs(['test-environment'], () =>
            pickEnvironment(context, { title: 'Delete Container Apps Environment', showLoadingPrompt: false })), expected);
    });

    test('forwards standalone environment filter and message without changing subscription discovery', async () => {
        installHierarchy([environment('test-environment', 'Express')], []);
        const context = await createTestActionContext();
        context.ui.showQuickPick = async (items, options) => {
            assert.deepStrictEqual(await items, []);
            assert.strictEqual(options?.noPicksMessage, 'No matching environments');
            throw new UserCancelledError();
        };
        await assert.rejects(pickEnvironment(context, {
            filter: () => false, noPicksMessage: 'No matching environments', showLoadingPrompt: false,
        }), UserCancelledError);
    });

    async function promptStep(step: AzureWizardPromptStep<AzureResourceQuickPickWizardContext>, expectedLabels: string[]): Promise<void> {
        const context: AzureResourceQuickPickWizardContext = { ...await createTestActionContext(), pickedNodes: [] };
        context.ui.showQuickPick = async items => {
            assert.deepStrictEqual((await items).map(item => item.label), expectedLabels);
            throw new UserCancelledError();
        };
        await assert.rejects(step.prompt(context), UserCancelledError);
    }

    for (const resource of ['environment', 'app']) {
        test(`preserves regex ${resource} preselection and prompts when multiple matches remain`, async () => {
            const items = resource === 'environment'
                ? [environment('match-one'), environment('match-two'), environment('unrelated')]
                : [app(false, KnownActiveRevisionsMode.Single, 'match-one'), app(true, KnownActiveRevisionsMode.Single, 'match-two'), app(false)];
            const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
            provider.getChildren = async () => items;
            provider.getTreeItem = element => {
                const item = items.find(item => item === element);
                assert.ok(item);
                return item.getTreeItem();
            };
            const step = resource === 'environment'
                ? getPickEnvironmentSteps(true, undefined, /^match-/)[2]
                : getPickContainerAppStep(/^match-/);
            await promptStep(step, ['match-one', 'match-two']);
        });

        test(`does not auto-select a command-bearing named ${resource}`, async () => {
            const item = resource === 'environment' ? environment('selected-resource') : app(false, KnownActiveRevisionsMode.Single, 'selected-resource');
            const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
            provider.getChildren = async () => [item];
            provider.getTreeItem = () => ({
                ...item.getTreeItem(), command: { command: 'test.command', title: 'Command-bearing resource' },
            });
            const step = resource === 'environment'
                ? getPickEnvironmentSteps(true, undefined, 'selected-resource')[2]
                : getPickContainerAppStep('selected-resource');
            await promptStep(step, ['selected-resource']);
        });
    }

    test('preserves the default app empty message', async () => {
        assert.deepStrictEqual(await pickerPicks([], undefined, 3), {
            labels: [], noPicksMessage: 'Selected container apps environment has no apps',
        });
    });

    test('cannot auto-select a named app rejected by its filter', async () => {
        const expected = app(true);
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        provider.getChildren = async () => [expected];
        provider.getTreeItem = () => expected.getTreeItem();
        await promptStep(getPickContainerAppStep('test-app', { filter: () => false }), []);
    });

    test('retains the original context filter when an optional filter accepts every item', async () => {
        const provider = ext.rgApiV2.resources.azureResourceTreeDataProvider;
        const expected = app(false);
        const unrelated = environment('unrelated');
        provider.getChildren = async () => [expected, unrelated];
        provider.getTreeItem = element => element === expected ? expected.getTreeItem() : unrelated.getTreeItem();
        await promptStep(getPickContainerAppStep(undefined, { filter: () => true }), ['test-app']);
    });

    test('preserves downstream app-to-revision discovery and name preselection', async () => {
        const parent = environment('test-environment', 'WorkloadProfiles');
        const selectedApp = app(false, KnownActiveRevisionsMode.Multiple);
        const { add, visited } = installHierarchy([parent], [selectedApp]);
        const group = new RevisionsItem(subscription, selectedApp.containerApp);
        const revision = new RevisionItem(subscription, selectedApp.containerApp, {
            id: `${selectedApp.id}/revisions/selected-revision`, name: 'selected-revision', template: { containers: [] },
        });
        add(selectedApp, [group]);
        add(group, [revision]);
        const context = await createTestActionContext();
        assert.strictEqual(await context.ui.runWithInputs(['test-environment', 'test-app'], () =>
            pickRevision(context, undefined, { selectByRevisionName: 'selected-revision', showLoadingPrompt: false })), revision);
        assert.ok(visited.includes(selectedApp));
        assert.ok(visited.includes(group));
    });
});
