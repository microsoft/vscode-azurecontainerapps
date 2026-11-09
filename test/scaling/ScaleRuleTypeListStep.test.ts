/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Environment } from '@azure/ms-rest-azure-env';
import { callWithTelemetryAndErrorHandling, createSubscriptionContext, TestUserInput } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { type IAddScaleRuleContext } from '../../src/commands/scaling/scaleRule/addScaleRule/IAddScaleRuleContext';
import { ScaleRuleTypeListStep } from '../../src/commands/scaling/scaleRule/addScaleRule/ScaleRuleTypeListStep';
import { HttpConcurrentRequestsStep } from '../../src/commands/scaling/scaleRule/addScaleRule/http/HttpConcurrentRequestsStep';
import { QueueNameStep } from '../../src/commands/scaling/scaleRule/addScaleRule/queue/QueueNameStep';
import { ScaleRuleTypes } from '../../src/constants';
import { ContainerAppItem } from '../../src/tree/ContainerAppItem';
import { ManagedEnvironmentItem } from '../../src/tree/ManagedEnvironmentItem';

suite('Scale rule types', () => {
    const subscription: AzureSubscription = {
        subscriptionId: 'subscription',
        tenantId: 'tenant',
        name: 'Test subscription',
        environment: Environment.AzureCloud,
        isCustomCloud: false,
        authentication: {
            getSession: () => { throw new Error('Unexpected authentication'); },
            getSessionWithScopes: () => { throw new Error('Unexpected authentication'); },
        },
    };
    const environmentId = '/subscriptions/subscription/resourceGroups/environment-group/providers/Microsoft.App/managedEnvironments/environment';
    const containerApp = ContainerAppItem.CreateContainerAppModel({
        id: '/subscriptions/subscription/resourceGroups/app-group/providers/Microsoft.App/containerApps/app',
        name: 'app',
        location: 'eastus',
        managedEnvironmentId: environmentId,
    });
    const originalGet = ManagedEnvironmentItem.Get;
    let environmentMode: string | undefined;
    let environmentReads: number;

    setup(() => {
        environmentMode = 'Express';
        environmentReads = 0;
        ManagedEnvironmentItem.Get = async (_context, actualSubscription, resourceGroup, name) => {
            environmentReads++;
            assert.strictEqual(actualSubscription, subscription);
            assert.strictEqual(resourceGroup, 'environment-group');
            assert.strictEqual(name, 'environment');
            return { id: environmentId, name, location: 'eastus', resourceGroup, environmentMode };
        };
    });

    teardown(() => {
        ManagedEnvironmentItem.Get = originalGet;
    });

    async function withContext(callback: (context: IAddScaleRuleContext, ui: TestUserInput) => Promise<void>): Promise<void> {
        await callWithTelemetryAndErrorHandling('scaleRuleTypes.test', async actionContext => {
            actionContext.errorHandling.rethrow = true;
            actionContext.errorHandling.suppressDisplay = true;
            const ui = new TestUserInput(vscode);
            const context: IAddScaleRuleContext = {
                ...actionContext,
                ...createSubscriptionContext(subscription),
                subscription,
                containerApp,
                parentResourceName: containerApp.name,
                registerActivity: async () => { assert.fail('Unexpected activity'); },
            };
            context.ui.showQuickPick = ui.showQuickPick.bind(ui);
            await callback(context, ui);
        });
    }

    test('keeps HTTP scaling available for Express apps', async () => {
        await withContext(async (context, ui) => {
            const step = new ScaleRuleTypeListStep();
            await ui.runWithInputs([ScaleRuleTypes.HTTP], () => step.prompt(context));
            assert.strictEqual(environmentReads, 1);
            assert.strictEqual(context.newRuleType, ScaleRuleTypes.HTTP);
            const subWizard = await step.getSubWizard(context);
            assert.ok(subWizard.promptSteps?.[0] instanceof HttpConcurrentRequestsStep);
        });
    });

    test('does not offer Azure queue for Express apps', async () => {
        await withContext(async (context, ui) => {
            await assert.rejects(
                ui.runWithInputs([ScaleRuleTypes.Queue], () => new ScaleRuleTypeListStep().prompt(context)),
                /Did not find quick pick item matching "Azure queue"\..*Picks: "HTTP scaling"$/
            );
            assert.strictEqual(environmentReads, 1);
            assert.strictEqual(context.newRuleType, undefined);
        });
    });

    for (const mode of ['Standard', undefined]) {
        test(`keeps Azure queue available when environmentMode is ${mode}`, async () => {
            environmentMode = mode;
            await withContext(async (context, ui) => {
                const step = new ScaleRuleTypeListStep();
                await ui.runWithInputs([ScaleRuleTypes.Queue], () => step.prompt(context));
                assert.strictEqual(context.newRuleType, ScaleRuleTypes.Queue);
                const subWizard = await step.getSubWizard(context);
                assert.ok(subWizard.promptSteps?.[0] instanceof QueueNameStep);
            });
        });
    }

    test('surfaces environment lookup failures instead of offering unsupported rules', async () => {
        const error = new Error('Environment unavailable');
        ManagedEnvironmentItem.Get = async () => { throw error; };
        await withContext(async context => {
            await assert.rejects(new ScaleRuleTypeListStep().prompt(context), actualError => actualError === error);
            assert.strictEqual(context.newRuleType, undefined);
        });
    });
});
