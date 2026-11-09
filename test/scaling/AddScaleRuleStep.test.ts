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
import { ScaleRuleTypes } from '../../src/constants';
import { ext } from '../../src/extensionVariables';
import { type ContainerAppModel } from '../../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../../src/tree/ManagedEnvironmentItem';
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
    let originalGet: typeof ManagedEnvironmentItem.Get;
    let environmentMode: string | undefined;
    let environmentRequests: number;
    let environmentError: Error | undefined;

    setup(() => {
        originalFileSystem = ext.revisionDraftFileSystem;
        originalGet = ManagedEnvironmentItem.Get;
        ext.revisionDraftFileSystem = new RevisionDraftFileSystem();
        environmentMode = 'Express';
        environmentRequests = 0;
        environmentError = undefined;
        ManagedEnvironmentItem.Get = async (_context, targetSubscription, resourceGroup, name) => {
            environmentRequests++;
            assert.strictEqual(targetSubscription, subscription);
            assert.strictEqual(resourceGroup, 'environments');
            assert.strictEqual(name, 'environment');
            if (environmentError) {
                throw environmentError;
            }
            return { id: environmentId, name, resourceGroup, location: 'eastus', environmentMode };
        };
    });

    teardown(() => {
        ext.revisionDraftFileSystem = originalFileSystem;
        ManagedEnvironmentItem.Get = originalGet;
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
        test(`preserves existing Express rules in ${revisionsMode} revision mode`, async () => {
            const rules = [httpRule('rule1'), queueRule, httpRule('rule2'), customRule];
            const item = createItem(rules, revisionsMode);
            const originalItem = JSON.parse(JSON.stringify(item.containerApp));
            const step = new TestAddScaleRuleStep(item);

            await step.execute(await createContext(item));

            assert.deepStrictEqual(step.updatedTemplate?.scale, {
                minReplicas: 0,
                maxReplicas: 10,
                rules: [...rules, { name: 'rule3', http: { metadata: { concurrentRequests: '30' } } }]
            });
            assert.deepStrictEqual(step.updatedTemplate?.containers, item.revision.template?.containers);
            assert.deepStrictEqual(item.containerApp, originalItem);
            assert.strictEqual(environmentRequests, 1);
        });
    }

    for (const mode of ['Standard', undefined]) {
        test(`preserves single HTTP replacement when environment mode is ${mode}`, async () => {
            environmentMode = mode;
            const item = createItem([httpRule('rule1'), queueRule, customRule]);
            const step = new TestAddScaleRuleStep(item);

            await step.execute(await createContext(item));

            assert.deepStrictEqual(step.updatedTemplate?.scale?.rules?.map(rule => rule.name), ['queue', 'custom', 'rule3']);
            assert.strictEqual(environmentRequests, 1);
        });
    }

    test('does not request the environment for the first HTTP rule', async () => {
        const item = createItem(undefined);
        const step = new TestAddScaleRuleStep(item);

        await step.execute(await createContext(item));

        assert.deepStrictEqual(step.updatedTemplate?.scale?.rules?.map(rule => rule.name), ['rule3']);
        assert.strictEqual(environmentRequests, 0);
    });

    test('preserves rules already added to an Express draft', async () => {
        const item = createItem([httpRule('rule1')]);
        const draft: Template = {
            containers: item.containerApp.template?.containers,
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
        assert.deepStrictEqual(item.containerApp.template?.scale?.rules?.map(rule => rule.name), ['rule1']);
        assert.deepStrictEqual(draft.scale?.rules?.map(rule => rule.name), ['rule1', 'rule2']);
    });

    test('retains the first Express HTTP rule when adding a second', async () => {
        const item = createItem([httpRule('rule1')]);
        const step = new TestAddScaleRuleStep(item);

        await step.execute(await createContext(item));

        assert.deepStrictEqual(step.updatedTemplate?.scale?.rules?.map(rule => rule.name), ['rule1', 'rule3']);
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
        assert.strictEqual(environmentRequests, 0);
    });

    test('does not write a draft if environment lookup fails', async () => {
        const item = createItem([httpRule('rule1'), httpRule('rule2')]);
        const step = new TestAddScaleRuleStep(item);
        environmentError = new Error('Environment unavailable');

        await assert.rejects(step.execute(await createContext(item)), environmentError);

        assert.strictEqual(step.updatedTemplate, undefined);
        assert.deepStrictEqual(item.containerApp.template?.scale?.rules?.map(rule => rule.name), ['rule1', 'rule2']);
    });
});
