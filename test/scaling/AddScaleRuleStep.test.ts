/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { KnownActiveRevisionsMode, type ScaleRule, type Template } from '@azure/arm-appcontainers';
import { Environment } from '@azure/ms-rest-azure-env';
import { createSubscriptionContext, createTestActionContext } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import { RevisionDraftFileSystem } from '../../src/commands/revisionDraft/RevisionDraftFileSystem';
import { AddScaleRuleStep } from '../../src/commands/scaling/scaleRule/addScaleRule/AddScaleRuleStep';
import { type IAddScaleRuleContext } from '../../src/commands/scaling/scaleRule/addScaleRule/IAddScaleRuleContext';
import { ScaleRuleNameStep } from '../../src/commands/scaling/scaleRule/addScaleRule/ScaleRuleNameStep';
import { ScaleRuleTypes } from '../../src/constants';
import { ext } from '../../src/extensionVariables';
import { type ContainerAppModel } from '../../src/tree/ContainerAppItem';
import { type RevisionsItemModel } from '../../src/tree/revisionManagement/RevisionItem';
import { createActivityContext } from '../../src/utils/activityUtils';

class TestAddScaleRuleStep extends AddScaleRuleStep<IAddScaleRuleContext> {
    public updatedTemplate: Template | undefined;

    protected async updateRevisionDraftWithTemplate(): Promise<void> {
        this.updatedTemplate = this.revisionDraftTemplate;
    }
}

suite('AddScaleRuleStep', () => {
    const subscriptionId = '11111111-1111-4111-8111-111111111174';
    const resourcePath = `/subscriptions/${subscriptionId}/resourceGroups/apps/providers/Microsoft.App`;
    const environmentId = `/subscriptions/${subscriptionId}/resourceGroups/environments/providers/Microsoft.App/managedEnvironments/environment`;
    const account = { id: 'fixture-account', label: 'Fixture account' };
    const session = { id: 'fixture-session', accessToken: 'fixture-token', scopes: [], account };
    const subscription: AzureSubscription = {
        subscriptionId,
        tenantId: '22222222-2222-4222-8222-222222221174',
        name: 'Fixture subscription',
        environment: Environment.AzureCloud,
        isCustomCloud: false,
        account,
        authentication: { getSession: async () => session, getSessionWithScopes: async () => session }
    };
    const httpRule = (name: string): ScaleRule => ({ name, http: { metadata: { concurrentRequests: '10' } } });
    const queueRule: ScaleRule = { name: 'queue', azureQueue: { queueName: 'queue', queueLength: 10 } };
    const customRule: ScaleRule = { name: 'custom', custom: { type: 'cpu', metadata: { value: '70' } } };
    let originalFileSystem: RevisionDraftFileSystem;

    setup(() => {
        originalFileSystem = ext.revisionDraftFileSystem;
        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
    });

    teardown(() => {
        ext.revisionDraftFileSystem = originalFileSystem;
    });

    function createItem(rules: ScaleRule[] | undefined, revisionsMode = KnownActiveRevisionsMode.Single): RevisionsItemModel {
        const template: Template = {
            containers: [{ name: 'container', image: 'example/image' }],
            scale: { minReplicas: 0, maxReplicas: 10, rules }
        };
        const containerApp: ContainerAppModel = {
            id: `${resourcePath}/containerApps/app`,
            name: 'app',
            resourceGroup: 'apps',
            location: 'eastus',
            managedEnvironmentId: environmentId,
            revisionsMode,
            latestRevisionName: 'app--latest',
            template: revisionsMode === KnownActiveRevisionsMode.Single ? template : { scale: { rules: [httpRule('latest-rule')] } }
        };
        return {
            id: `${containerApp.id}/scale/scalerules`,
            subscription,
            containerApp,
            revision: { id: `${containerApp.id}/revisions/app--selected`, name: 'app--selected', template },
            getTreeItem: () => ({})
        };
    }

    async function createContext(item: RevisionsItemModel): Promise<IAddScaleRuleContext> {
        return Object.assign(await createTestActionContext(), createSubscriptionContext(subscription), await createActivityContext(), {
            subscription,
            containerApp: item.containerApp,
            parentResourceName: 'app',
            newRuleName: 'rule3',
            newRuleType: ScaleRuleTypes.HTTP,
            newHttpConcurrentRequests: '30'
        });
    }

    for (const revisionsMode of [KnownActiveRevisionsMode.Single, KnownActiveRevisionsMode.Multiple]) {
        test(`rejects draft-only rule names in the prompt in ${revisionsMode} revision mode`, async () => {
            const item = createItem([], revisionsMode);
            const draft: Template = {
                containers: item.revision.template?.containers,
                scale: { minReplicas: 2, maxReplicas: 5, rules: [httpRule('rule2'), queueRule, customRule] }
            };
            const originalDraft = structuredClone(draft);
            ext.revisionDraftFileSystem.parseRevisionDraft = baseItem => {
                assert.strictEqual(baseItem, item);
                return draft;
            };
            const context = await createContext(item);
            delete context.newRuleName;
            context.ui.showInputBox = async options => {
                const validateInput = options?.validateInput;
                assert.ok(validateInput);
                for (const name of ['rule2', ' rule2 ', 'queue', 'custom']) {
                    assert.strictEqual(await validateInput(name), `The scale rule "${name.trim()}" already exists in container app "app". Please enter a unique name.`);
                }
                assert.strictEqual(await validateInput('rule3'), undefined);
                assert.ok(options.asyncValidationTask, 'Live-name validation must still be registered');
                return 'rule3';
            };

            await new ScaleRuleNameStep(item).prompt(context);

            assert.strictEqual(context.newRuleName, 'rule3');
            assert.deepStrictEqual(draft, originalDraft);
        });

        test(`preserves existing HTTP and unrelated rules in ${revisionsMode} revision mode`, async () => {
            const rules = [httpRule('rule1'), queueRule, httpRule('rule2'), customRule];
            const item = createItem(rules, revisionsMode);
            const originalApp = structuredClone(item.containerApp);
            const originalRevision = structuredClone(item.revision);
            const step = new TestAddScaleRuleStep(item);

            await step.execute(await createContext(item));

            assert.deepStrictEqual(step.updatedTemplate?.scale, {
                minReplicas: 0,
                maxReplicas: 10,
                rules: [...rules, { name: 'rule3', http: { metadata: { concurrentRequests: '30' } } }]
            });
            assert.deepStrictEqual(step.updatedTemplate?.containers, item.revision.template?.containers);
            assert.deepStrictEqual(item.containerApp, originalApp);
            assert.deepStrictEqual(item.revision, originalRevision);
        });

        test(`preserves accumulated draft rules and settings in ${revisionsMode} revision mode`, async () => {
            const item = createItem([httpRule('rule1')], revisionsMode);
            const originalApp = structuredClone(item.containerApp);
            const draft: Template = {
                containers: item.revision.template?.containers,
                scale: { minReplicas: 2, maxReplicas: 5, rules: [httpRule('rule1'), httpRule('rule2')] }
            };
            ext.revisionDraftFileSystem.parseRevisionDraft = () => structuredClone(draft);
            const step = new TestAddScaleRuleStep(item);

            await step.execute(await createContext(item));

            assert.deepStrictEqual(step.updatedTemplate?.scale, {
                minReplicas: 2,
                maxReplicas: 5,
                rules: [...draft.scale?.rules ?? [], { name: 'rule3', http: { metadata: { concurrentRequests: '30' } } }]
            });
            assert.deepStrictEqual(item.containerApp, originalApp);
            assert.deepStrictEqual(draft.scale?.rules?.map(rule => rule.name), ['rule1', 'rule2']);
        });

        test(`retains the first HTTP rule when adding a second in ${revisionsMode} revision mode`, async () => {
            const item = createItem([httpRule('rule1')], revisionsMode);
            const step = new TestAddScaleRuleStep(item);

            await step.execute(await createContext(item));

            assert.deepStrictEqual(step.updatedTemplate?.scale?.rules?.map(rule => rule.name), ['rule1', 'rule3']);
        });
    }

    for (const draft of [undefined, {}, { scale: {} }, { scale: { rules: [] } }] satisfies (Template | undefined)[]) {
        test(`accepts a new name with ${JSON.stringify(draft) ?? 'no draft'}`, async () => {
            const item = createItem([]);
            ext.revisionDraftFileSystem.parseRevisionDraft = () => draft;
            const context = await createContext(item);
            context.ui.showInputBox = async options => {
                assert.ok(options?.validateInput);
                assert.strictEqual(await options.validateInput('rule3'), undefined);
                return 'rule3';
            };

            await new ScaleRuleNameStep(item).prompt(context);

            assert.strictEqual(context.newRuleName, 'rule3');
        });
    }

    for (const rules of [undefined, []]) {
        test(`adds the first HTTP rule with ${rules === undefined ? 'missing' : 'empty'} rules`, async () => {
            const item = createItem(rules);
            const step = new TestAddScaleRuleStep(item);

            await step.execute(await createContext(item));

            assert.deepStrictEqual(step.updatedTemplate?.scale?.rules?.map(rule => rule.name), ['rule3']);
        });
    }

    test('initializes missing scale settings for the first HTTP rule', async () => {
        const item = createItem(undefined);
        delete item.containerApp.template?.scale;
        const step = new TestAddScaleRuleStep(item);

        await step.execute(await createContext(item));

        assert.deepStrictEqual(step.updatedTemplate?.scale?.rules?.map(rule => rule.name), ['rule3']);
        assert.strictEqual(item.containerApp.template?.scale, undefined);
    });

    test('does not change queue rule additions', async () => {
        const item = createItem([httpRule('rule1'), httpRule('rule2'), customRule]);
        const context = await createContext(item);
        context.newRuleType = ScaleRuleTypes.Queue;
        context.newQueueName = 'new-queue';
        context.newQueueLength = 10;
        context.secretName = 'queue-secret';
        context.newQueueTriggerParameter = 'connection';
        const step = new TestAddScaleRuleStep(item);

        await step.execute(context);

        assert.deepStrictEqual(step.updatedTemplate?.scale?.rules?.map(rule => rule.name), ['rule1', 'rule2', 'custom', 'rule3']);
        assert.deepStrictEqual(context.scaleRule?.azureQueue, {
            queueName: 'new-queue',
            queueLength: 10,
            auth: [{ secretRef: 'queue-secret', triggerParameter: 'connection' }]
        });
    });
});
