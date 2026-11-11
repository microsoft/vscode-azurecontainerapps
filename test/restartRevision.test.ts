/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Revision } from '@azure/arm-appcontainers';
import { createHttpHeaders, type Pipeline, type PipelineRequest } from '@azure/core-rest-pipeline';
import { Environment } from '@azure/ms-rest-azure-env';
import { TestInput, TreeElementStateManager, UserCancelledError, createTestActionContext } from '@microsoft/vscode-azext-utils';
import { AzExtResourceType, type AzureResource, type AzureSubscription, type ResourceGroupsTreeDataProvider } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { executeRevisionOperation, type RevisionOperation } from '../src/commands/revision/changeRevisionActiveState';
import { getRevisionCommandPickOptions } from '../src/commands/revision/getRevisionCommandPickOptions';
import { editRevisionDraft } from '../src/commands/revisionDraft/editRevisionDraft';
import { RevisionDraftFileSystem } from '../src/commands/revisionDraft/RevisionDraftFileSystem';
import { expressContextValue, revisionModeMultipleContextValue, revisionModeSingleContextValue, revisionRestartUnsupportedContextValue } from '../src/constants';
import { ext } from '../src/extensionVariables';
import { ContainerAppItem, type ContainerAppModel } from '../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../src/tree/ManagedEnvironmentItem';
import { RevisionDraftItem } from '../src/tree/revisionManagement/RevisionDraftItem';
import { RevisionItem } from '../src/tree/revisionManagement/RevisionItem';
import { getPickContainerAppStep, pickContainerApp, pickContainerAppWithoutPrompt } from '../src/utils/pickItem/pickContainerApp';
import { getPickEnvironmentSteps, pickEnvironment } from '../src/utils/pickItem/pickEnvironment';
import { type ContainerAppPickItemOptions } from '../src/utils/pickItem/PickItemOptions';

suite('Revision command availability', () => {
    const operations: RevisionOperation[] = ['activateRevision', 'deactivateRevision', 'restartRevision'];
    const commands = [...operations, 'editRevisionDraft'] as const;
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
    const app: ContainerAppModel = {
        id: '/subscriptions/subscription/resourceGroups/group/providers/Microsoft.App/containerApps/app',
        name: 'app',
        resourceGroup: 'group',
        location: 'eastus',
        managedEnvironmentId: '/subscriptions/subscription/resourceGroups/group/providers/Microsoft.App/managedEnvironments/environment',
        revisionsMode: KnownActiveRevisionsMode.Single,
        latestRevisionName: 'app--revision',
    };
    const revision: Revision = { id: `${app.id}/revisions/app--revision`, name: 'app--revision', active: true };
    const standardPick = createPick('standard-app');
    const expressPick = createPick('express-app', true);
    const restartPickOptions: ContainerAppPickItemOptions = {
        filter: treeItem => !treeItem.contextValue?.split(';').includes(revisionRestartUnsupportedContextValue),
        noPicksMessage: 'No Standard apps',
    };
    let originalRgApi: typeof ext.rgApiV2;
    let originalDraftFileSystem: typeof ext.revisionDraftFileSystem;
    let originalContext: typeof ext.context;
    let originalState: typeof ext.state;
    let pipelinePrototype: Pipeline | undefined;
    let originalSendRequest: Pipeline['sendRequest'];

    setup(() => {
        originalRgApi = ext.rgApiV2;
        originalDraftFileSystem = ext.revisionDraftFileSystem;
        originalContext = ext.context;
        originalState = ext.state;
        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
        ext.state = new TreeElementStateManager();
        ext.context = { ...originalContext, extensionUri: Uri.file(path.join(__dirname, '..')) };
    });

    teardown(() => {
        ext.rgApiV2 = originalRgApi;
        ext.revisionDraftFileSystem = originalDraftFileSystem;
        ext.context = originalContext;
        ext.state.dispose();
        ext.state = originalState;
        if (pipelinePrototype) {
            pipelinePrototype.sendRequest = originalSendRequest;
            pipelinePrototype = undefined;
        }
    });

    function setPickerChildren(children?: TreeItem[]): void {
        const provider: ResourceGroupsTreeDataProvider = {
            getChildren: () => children,
            getTreeItem: element => {
                assert.ok(element instanceof TreeItem);
                return element;
            },
        };
        ext.rgApiV2 = {
            ...originalRgApi,
            resources: {
                ...originalRgApi?.resources,
                azureResourceTreeDataProvider: provider,
            },
        };
    }

    function environment(name: string, environmentMode?: string): ManagedEnvironmentItem {
        const resource: AzureResource = {
            id: `/subscriptions/subscription/resourceGroups/group/providers/Microsoft.App/managedEnvironments/${name}`,
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
        const elements = environments.map(branchItem => wrapped ? { branchItem, unwrap: () => branchItem } : branchItem);
        const children = new Map<unknown, unknown[]>([
            [undefined, [subscriptionNode]], [subscriptionNode, [group]], [group, elements],
            ...elements.map<[unknown, unknown[]]>(element => [element, apps]),
        ]);
        const treeItems = new Map<unknown, TreeItem>([
            [subscriptionNode, new TreeItem(subscription.name, TreeItemCollapsibleState.Collapsed)],
            [group, group],
            ...elements.map<[unknown, TreeItem]>((element, index) => [element, environments[index].getTreeItem()]),
            ...apps.map<[unknown, TreeItem]>(item => [item, item.getTreeItem()]),
        ]);
        const provider: ResourceGroupsTreeDataProvider = {
            getChildren(element) {
                assert.strictEqual(this, provider);
                return children.get(element) ?? [];
            },
            getTreeItem(element) {
                assert.strictEqual(this, provider);
                const treeItem = treeItems.get(element);
                assert.ok(treeItem);
                return treeItem;
            },
        };
        ext.rgApiV2 = { ...originalRgApi, resources: { ...originalRgApi?.resources, azureResourceTreeDataProvider: provider } };
    }

    for (const command of commands) {
        for (const wrapped of [false, true]) {
            test(`${command} excludes Express environments and retains Standard/legacy ${wrapped ? 'wrapped' : 'bare'} models`, async () => {
                setPickerHierarchy([
                    environment('express-environment', 'Express'),
                    environment('standard', 'WorkloadProfiles'),
                    environment('legacy'),
                    environment('express', 'WorkloadProfiles'),
                ], [], wrapped);
                const context = await createTestActionContext();
                context.ui.showQuickPick = async picks => {
                    assert.deepStrictEqual((await picks).map(pick => pick.label), ['standard', 'legacy', 'express']);
                    throw new UserCancelledError();
                };

                await assert.rejects(command === 'editRevisionDraft'
                    ? editRevisionDraft(context) : executeRevisionOperation(context, undefined, command), UserCancelledError);
            });

            test(`${command} rejects Express-only environment fallback with ${wrapped ? 'wrapped' : 'bare'} models`, async () => {
                setPickerHierarchy([environment('express-environment', 'Express')], [], wrapped);
                const context = await createTestActionContext();
                context.ui.showQuickPick = async (picks, options) => {
                    assert.deepStrictEqual(await picks, []);
                    assert.strictEqual(options?.noPicksMessage, 'Current subscription has no Standard container apps environments');
                    throw new UserCancelledError();
                };

                await assert.rejects(command === 'editRevisionDraft'
                    ? editRevisionDraft(context) : executeRevisionOperation(context, undefined, command), UserCancelledError);
            });
        }
    }

    for (const command of commands) {
        test(`${command} filters app mode and Express ancestry without hiding a Standard app named express`, async () => {
            const single = new ContainerAppItem(subscription, { ...app, name: 'single' });
            const multiple = new ContainerAppItem(subscription, { ...app, name: 'multiple', revisionsMode: KnownActiveRevisionsMode.Multiple });
            const namedExpress = new ContainerAppItem(subscription, { ...app, name: 'express', revisionsMode: KnownActiveRevisionsMode.Multiple });
            const express = new ContainerAppItem(subscription, { ...app, name: 'express-app', revisionsMode: KnownActiveRevisionsMode.Multiple }, true);
            const parent = environment('standard', 'WorkloadProfiles');
            setPickerHierarchy([parent], [single, multiple, namedExpress, express]);
            const context = await createTestActionContext();
            let prompts = 0;
            context.ui.showQuickPick = async picks => {
                const choices = await picks;
                if (prompts++ === 0) {
                    return choices[0];
                }
                assert.deepStrictEqual(choices.map(pick => pick.label), command === 'restartRevision'
                    ? ['single', 'multiple', 'express'] : ['multiple', 'express']);
                throw new UserCancelledError();
            };

            await assert.rejects(command === 'editRevisionDraft'
                ? editRevisionDraft(context) : executeRevisionOperation(context, undefined, command), UserCancelledError);
        });

        test(`${command} does not offer a Single app as an expandable fallback`, async () => {
            setPickerChildren([createPick('single')]);
            const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });
            const options = getRevisionCommandPickOptions(command);
            if (command === 'restartRevision') {
                await context.ui.runWithInputs(['single'], () => getPickContainerAppStep(undefined, options).prompt(context));
            } else {
                await assert.rejects(
                    context.ui.runWithInputs([TestInput.UseDefaultValue], () => getPickContainerAppStep(undefined, options).prompt(context)),
                    /No quick pick items found/,
                );
                assert.deepStrictEqual(context.pickedNodes, ['environment']);
            }
        });
    }

    test('scopes environment and app callbacks to their respective picker steps', async () => {
        const parent = environment('standard', 'WorkloadProfiles');
        const selectedApp = new ContainerAppItem(subscription, app);
        setPickerHierarchy([parent], [selectedApp]);
        const context = await createTestActionContext();
        let environmentCalls = 0;
        let appCalls = 0;
        const selected = await context.ui.runWithInputs(['standard', 'app'], () => pickContainerApp(context, {
            showLoadingPrompt: false,
            environmentOptions: {
                filter: (_treeItem, element) => {
                    assert.strictEqual(element, parent);
                    environmentCalls++;
                    return true;
                },
                noPicksMessage: 'No matching environments',
            },
            filter: (_treeItem, element) => {
                assert.strictEqual(element, selectedApp);
                appCalls++;
                return true;
            },
            noPicksMessage: 'No matching apps',
        }));

        assert.strictEqual(selected, selectedApp);
        assert.ok(environmentCalls > 0);
        assert.ok(appCalls > 0);
    });

    test('does not leak app filtering or its empty message into environment selection', async () => {
        const parent = environment('express-environment', 'Express');
        setPickerHierarchy([parent], []);
        const context = await createTestActionContext();
        let prompts = 0;
        context.ui.showQuickPick = async (picks, options) => {
            const choices = await picks;
            if (prompts++ === 0) {
                assert.deepStrictEqual(choices.map(pick => pick.label), ['express-environment']);
                assert.strictEqual(options?.noPicksMessage, 'Current subscription has no container apps environments');
                return choices[0];
            }
            assert.deepStrictEqual(choices, []);
            assert.strictEqual(options?.noPicksMessage, 'No matching apps');
            throw new UserCancelledError();
        };

        await assert.rejects(pickContainerApp(context, {
            filter: () => false, noPicksMessage: 'No matching apps', showLoadingPrompt: false,
        }), UserCancelledError);
        assert.strictEqual(prompts, 2);
    });

    test('does not leak environment filtering or its empty message into app selection', async () => {
        const parent = environment('standard', 'WorkloadProfiles');
        setPickerHierarchy([parent]);
        const context = await createTestActionContext();
        let prompts = 0;
        context.ui.showQuickPick = async (picks, options) => {
            const choices = await picks;
            if (prompts++ === 0) {
                assert.strictEqual(options?.noPicksMessage, 'No matching environments');
                return choices[0];
            }
            assert.deepStrictEqual(choices, []);
            assert.strictEqual(options?.noPicksMessage, 'Selected container apps environment has no apps');
            throw new UserCancelledError();
        };

        await assert.rejects(pickContainerApp(context, {
            environmentOptions: {
                filter: (_treeItem, element) => {
                    assert.strictEqual(element, parent);
                    return true;
                },
                noPicksMessage: 'No matching environments',
            },
            showLoadingPrompt: false,
        }), UserCancelledError);
        assert.strictEqual(prompts, 2);
    });

    test('forwards standalone environment filter and no-picks message', async () => {
        setPickerHierarchy([environment('express-environment', 'Express')]);
        const context = await createTestActionContext();
        context.ui.showQuickPick = async (picks, options) => {
            assert.deepStrictEqual(await picks, []);
            assert.strictEqual(options?.noPicksMessage, 'No matching environments');
            throw new UserCancelledError();
        };

        await assert.rejects(pickEnvironment(context, {
            filter: () => false, noPicksMessage: 'No matching environments', showLoadingPrompt: false,
        }), UserCancelledError);
    });

    test('applies environment callbacks to expandable ancestors', async () => {
        const excluded = new TreeItem('excluded', TreeItemCollapsibleState.Collapsed);
        const included = new TreeItem('included', TreeItemCollapsibleState.Collapsed);
        setPickerChildren([excluded, included]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['group'] });

        await context.ui.runWithInputs(['included'], () => getPickEnvironmentSteps(false, undefined, undefined, {
            filter: (_treeItem, element) => element === included,
        })[2].prompt(context));

        assert.strictEqual(context.pickedNodes.at(-1), included);
    });

    for (const filteredStep of ['environment', 'app']) {
        test(`named no-prompt picking respects scoped ${filteredStep} filtering`, async () => {
            const parent = environment('standard', 'WorkloadProfiles');
            const selectedApp = new ContainerAppItem(subscription, { ...app, environmentId: parent.id });
            setPickerHierarchy([parent], [selectedApp]);
            const context = await createTestActionContext();
            context.ui.showQuickPick = async (picks, options) => {
                assert.deepStrictEqual(await picks, []);
                assert.strictEqual(options?.noPicksMessage, filteredStep === 'environment'
                    ? 'No matching environments' : 'No matching apps');
                throw new UserCancelledError();
            };

            await assert.rejects(pickContainerAppWithoutPrompt({
                ...context, subscriptionId: subscription.subscriptionId,
            }, selectedApp.containerApp, {
                environmentOptions: filteredStep === 'environment' ? {
                    filter: () => false, noPicksMessage: 'No matching environments',
                } : undefined,
                filter: filteredStep === 'app' ? () => false : undefined,
                noPicksMessage: 'No matching apps',
                showLoadingPrompt: false,
            }), UserCancelledError);
        });
    }

    test('excludes Express apps while retaining Standard apps', async () => {
        setPickerChildren([expressPick, standardPick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await context.ui.runWithInputs(['standard-app'], () => getPickContainerAppStep(undefined, restartPickOptions).prompt(context));

        assert.strictEqual(context.pickedNodes.at(-1), standardPick);
    });

    test('does not offer Express apps as expandable fallback choices', async () => {
        setPickerChildren([expressPick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await assert.rejects(
            context.ui.runWithInputs([TestInput.UseDefaultValue], () => getPickContainerAppStep(undefined, restartPickOptions).prompt(context)),
            /No quick pick items found/,
        );
        assert.deepStrictEqual(context.pickedNodes, ['environment']);
    });

    test('rejects selecting an Express app from mixed results', async () => {
        setPickerChildren([expressPick, standardPick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await assert.rejects(
            context.ui.runWithInputs(['express-app'], () => getPickContainerAppStep(undefined, restartPickOptions).prompt(context)),
            /Did not find quick pick item matching "express-app".*Picks: "standard-app"/,
        );
    });

    test('preserves Express picks for commands without the restart restriction', async () => {
        setPickerChildren([expressPick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await context.ui.runWithInputs(['express-app'], () => getPickContainerAppStep().prompt(context));

        assert.strictEqual(context.pickedNodes.at(-1), expressPick);
    });

    test('does not confuse a Standard app named express with an Express app', async () => {
        const node = new ContainerAppItem(subscription, { ...app, name: 'express' });
        const pick = Object.assign(new TreeItem('express'), node.getTreeItem());
        setPickerChildren([pick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await context.ui.runWithInputs(['express'], () => getPickContainerAppStep(undefined, restartPickOptions).prompt(context));

        assert.strictEqual(context.pickedNodes.at(-1), pick);
    });

    test('preserves named app selection without prompting', async () => {
        setPickerChildren([expressPick, standardPick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await getPickContainerAppStep('standard-app', restartPickOptions).prompt(context);

        assert.strictEqual(context.pickedNodes.at(-1), standardPick);
    });

    test('handles missing children without offering a resource', async () => {
        setPickerChildren();
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await assert.rejects(
            context.ui.runWithInputs([TestInput.UseDefaultValue], () => getPickContainerAppStep(undefined, restartPickOptions).prompt(context)),
            /No quick pick items found/,
        );
    });

    test('passes tree items and elements to a caller-defined filter', async () => {
        setPickerChildren([expressPick, standardPick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await context.ui.runWithInputs(['express-app'], () => getPickContainerAppStep(undefined, {
            filter: (treeItem, element) => {
                assert.strictEqual(treeItem, element);
                return element === expressPick;
            },
        }).prompt(context));

        assert.strictEqual(context.pickedNodes.at(-1), expressPick);
    });

    test('applies the callback to expandable ancestor choices', async () => {
        const excluded = new TreeItem('excluded', TreeItemCollapsibleState.Collapsed);
        const included = new TreeItem('included', TreeItemCollapsibleState.Collapsed);
        setPickerChildren([excluded, included]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await context.ui.runWithInputs(['included'], () => getPickContainerAppStep(undefined, {
            filter: (_treeItem, element) => element === included,
        }).prompt(context));

        assert.strictEqual(context.pickedNodes.at(-1), included);
    });

    test('does not auto-select a named app rejected by the callback', async () => {
        setPickerChildren([expressPick]);
        const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });

        await assert.rejects(
            context.ui.runWithInputs([TestInput.UseDefaultValue], () => getPickContainerAppStep('express-app', restartPickOptions).prompt(context)),
            /No quick pick items found/,
        );
        assert.deepStrictEqual(context.pickedNodes, ['environment']);
    });

    for (const noPicksMessage of [undefined, 'No apps match this filter']) {
        test(`uses the ${noPicksMessage ? 'custom' : 'default'} no-picks message`, async () => {
            setPickerChildren([expressPick, standardPick]);
            const context = Object.assign(await createTestActionContext(), { pickedNodes: ['environment'] });
            context.ui.showQuickPick = async (picks, options) => {
                assert.deepStrictEqual(picks, []);
                assert.strictEqual(options?.noPicksMessage, noPicksMessage ?? 'Selected container apps environment has no apps');
                throw new Error('Empty picks verified');
            };

            await assert.rejects(
                getPickContainerAppStep(undefined, { filter: () => false, noPicksMessage }).prompt(context),
                /Empty picks verified/,
            );
            assert.deepStrictEqual(context.pickedNodes, ['environment']);
        });
    }

    test('blocks direct Express app restart before accessing Azure or operation state', async () => {
        const context = await createTestActionContext();
        const node = new ContainerAppItem(subscription, app, true);

        await assert.rejects(
            executeRevisionOperation(context, node, 'restartRevision'),
            /Restart is not supported for Express Container Apps/,
        );
        assert.ok(node.getTreeItem().contextValue?.split(';').includes(revisionRestartUnsupportedContextValue));
    });

    test('blocks direct Express revision restart', async () => {
        const context = await createTestActionContext();
        const node = new RevisionItem(subscription, app, revision, true);

        await assert.rejects(
            executeRevisionOperation(context, node, 'restartRevision'),
            /Restart is not supported for Express Container Apps/,
        );
        assert.ok(node.getTreeItem().contextValue?.split(';').includes(revisionRestartUnsupportedContextValue));
    });

    for (const operation of ['activateRevision', 'deactivateRevision'] as const) {
        for (const mode of [KnownActiveRevisionsMode.Single, KnownActiveRevisionsMode.Multiple]) {
            for (const kind of ['app', 'revision'] as const) {
                test(`blocks direct Express ${mode} ${kind} ${operation} before accessing Azure or operation state`, async () => {
                    ext.state.runWithTemporaryDescription = () => assert.fail('Must not enter operation state');
                    const model = { ...app, revisionsMode: mode };
                    const node = kind === 'app'
                        ? new ContainerAppItem(subscription, model, true)
                        : new RevisionItem(subscription, model, revision, true);

                    await assert.rejects(executeRevisionOperation(await createTestActionContext(), node, operation),
                        /Express Container Apps do not support revision activation or deactivation. Use Start or Stop instead/);
                });
            }
        }

        test(`blocks direct Standard Single ${operation} before accessing Azure or operation state`, async () => {
            ext.state.runWithTemporaryDescription = () => assert.fail('Must not enter operation state');
            const context = await createTestActionContext();
            for (const node of [new ContainerAppItem(subscription, app), new RevisionItem(subscription, app, revision)]) {
                await assert.rejects(executeRevisionOperation(context, node, operation),
                    /You must be in multiple revisions mode to run this command/);
            }
        });
    }

    for (const operation of operations) {
        for (const mode of [KnownActiveRevisionsMode.Single, KnownActiveRevisionsMode.Multiple]) {
            if (operation !== 'restartRevision' && mode === KnownActiveRevisionsMode.Single) {
                continue;
            }

            test(`dispatches Standard ${mode} ${operation} to the selected revision and refreshes after mocked ARM success`, async () => {
                const requests: PipelineRequest[] = [];
                const refreshed: string[] = [];
                const { ContainerAppsAPIClient } = await import('@azure/arm-appcontainers');
                const client = new ContainerAppsAPIClient({ getToken: async () => null }, subscription.subscriptionId);
                pipelinePrototype = Object.getPrototypeOf(client.pipeline);
                assert.ok(pipelinePrototype);
                originalSendRequest = pipelinePrototype.sendRequest;
                pipelinePrototype.sendRequest = async (_httpClient, request) => {
                    requests.push(request);
                    return { request, status: 200, headers: createHttpHeaders() };
                };
                ext.state.runWithTemporaryDescription = async (_id, _description, callback) => callback();
                ext.state.notifyChildrenChanged = id => { refreshed.push(id); };
                const model = { ...app, revisionsMode: mode };
                const selectedRevision = { ...revision, name: 'app--selected', id: `${app.id}/revisions/app--selected` };
                const node = mode === KnownActiveRevisionsMode.Single
                    ? new ContainerAppItem(subscription, model)
                    : new RevisionItem(subscription, model, selectedRevision);

                await executeRevisionOperation(await createTestActionContext(), node, operation);

                assert.strictEqual(requests.length, 1);
                assert.strictEqual(requests[0].method, 'POST');
                const revisionName = mode === KnownActiveRevisionsMode.Single ? app.latestRevisionName : selectedRevision.name;
                assert.strictEqual(new URL(requests[0].url).pathname, `${app.id}/revisions/${revisionName}/${operation.replace('Revision', '')}`);
                assert.deepStrictEqual(refreshed, [app.id]);
            });
        }
    }

    test('rejects advanced draft editing in Single mode before reading the draft filesystem', async () => {
        ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft = () => assert.fail('Must not read drafts');
        const node = new RevisionDraftItem(subscription, app, revision);

        await assert.rejects(editRevisionDraft(await createTestActionContext(), node),
            /You must be in multiple revisions mode to run this command/);
    });

    test('retains the missing draft error for a Multiple mode app', async () => {
        const node = new RevisionDraftItem(subscription, { ...app, revisionsMode: KnownActiveRevisionsMode.Multiple }, revision);

        await assert.rejects(editRevisionDraft(await createTestActionContext(), node), /No revision draft exists/);
    });

    test('opens the existing Multiple mode draft', async () => {
        const node = new RevisionDraftItem(subscription, { ...app, revisionsMode: KnownActiveRevisionsMode.Multiple }, revision);
        ext.revisionDraftFileSystem.doesContainerAppsItemHaveRevisionDraft = () => true;
        let opened = false;
        ext.revisionDraftFileSystem.editRevisionDraft = async item => {
            assert.strictEqual(item, node);
            opened = true;
        };

        await editRevisionDraft(await createTestActionContext(), node);
        assert.ok(opened);
    });

    for (const mode of [KnownActiveRevisionsMode.Single, KnownActiveRevisionsMode.Multiple]) {
        test(`exposes ${mode} revision and draft mode contexts for menu filtering`, async () => {
            const model = { ...app, revisionsMode: mode };
            const node = new RevisionItem(subscription, model, revision, true);
            const draft = new RevisionDraftItem(subscription, model, revision);
            draft.hasUnsavedChanges = async () => false;
            const modeContext = mode === KnownActiveRevisionsMode.Multiple ? revisionModeMultipleContextValue : revisionModeSingleContextValue;

            assert.ok(node.getTreeItem().contextValue?.split(';').includes(modeContext));
            assert.ok(node.getTreeItem().contextValue?.split(';').includes(expressContextValue));
            assert.ok((await draft.getTreeItem()).contextValue?.split(';').includes(modeContext));
        });
    }

    test('matches activation and advanced draft menu eligibility to the direct guards', () => {
        const manifest: { contributes: { menus: Record<string, { command: string; when: string }[]> } } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        const menus = manifest.contributes.menus['view/item/context'];
        for (const command of ['containerApps.activateRevision', 'containerApps.deactivateRevision', 'containerApps.editRevisionDraft']) {
            const contributions = menus.filter(menu => menu.command === command);
            assert.strictEqual(contributions.length, 1);
            assert.ok(contributions[0].when.includes('viewItem =~ /(^|;)revisionMode:multiple(;|$)/i'));
            if (command !== 'containerApps.editRevisionDraft') {
                assert.ok(contributions[0].when.includes('!(viewItem =~ /(^|;)express(;|$)/i)'));
            }
        }
    });

    test('keeps Standard revision contexts free of the Express marker', () => {
        const node = new RevisionItem(subscription, app, revision);

        assert.strictEqual(node.isExpress, false);
        assert.strictEqual(node.getTreeItem().contextValue?.split(';').includes(revisionRestartUnsupportedContextValue), false);
    });

    test('restricts both restart menu contributions by the unsupported restart context segment', () => {
        const manifest: { contributes: { menus: Record<string, { command: string; when: string }[]> } } = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
        const menus = manifest.contributes.menus['view/item/context'].filter(menu => menu.command === 'containerApps.restartRevision');

        assert.strictEqual(menus.length, 2);
        for (const menu of menus) {
            assert.ok(menu.when.includes('!(viewItem =~ /(^|;)revisionRestart:unsupported(;|$)/i)'));
        }
    });
});

function createPick(name: string, isExpress: boolean = false): TreeItem {
    const pick = new TreeItem(name, TreeItemCollapsibleState.Collapsed);
    pick.contextValue = `containerAppItem;${name};revisionMode:single${isExpress ? `;${revisionRestartUnsupportedContextValue}` : ''}`;
    return pick;
}
