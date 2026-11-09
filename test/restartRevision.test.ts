/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type Revision } from '@azure/arm-appcontainers';
import { Environment } from '@azure/ms-rest-azure-env';
import { TestInput, createTestActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription, type ResourceGroupsTreeDataProvider } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { TreeItem, TreeItemCollapsibleState, Uri } from 'vscode';
import { executeRevisionOperation } from '../src/commands/revision/changeRevisionActiveState';
import { RevisionDraftFileSystem } from '../src/commands/revisionDraft/RevisionDraftFileSystem';
import { revisionRestartUnsupportedContextValue } from '../src/constants';
import { ext } from '../src/extensionVariables';
import { ContainerAppItem, type ContainerAppModel } from '../src/tree/ContainerAppItem';
import { RevisionItem } from '../src/tree/revisionManagement/RevisionItem';
import { getPickContainerAppStep } from '../src/utils/pickItem/pickContainerApp';
import { type ContainerAppPickItemOptions } from '../src/utils/pickItem/PickItemOptions';

suite('Restart revision availability', () => {
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

    setup(() => {
        originalRgApi = ext.rgApiV2;
        originalDraftFileSystem = ext.revisionDraftFileSystem;
        originalContext = ext.context;
        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
        ext.context = { ...originalContext, extensionUri: Uri.file(path.join(__dirname, '..')) };
    });

    teardown(() => {
        ext.rgApiV2 = originalRgApi;
        ext.revisionDraftFileSystem = originalDraftFileSystem;
        ext.context = originalContext;
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
