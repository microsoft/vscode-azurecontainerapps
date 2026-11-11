/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type AppLogsConfiguration, type ContainerApp, type ManagedEnvironment } from '@azure/arm-appcontainers';
import { Environment } from '@azure/ms-rest-azure-env';
import { registerErrorHandler, registerTelemetryHandler } from '@microsoft/vscode-azext-utils';
import { type AzureSubscription } from '@microsoft/vscode-azureresources-api';
import * as assert from 'assert';
import { type TreeItem } from 'vscode';
import { LogsGroupItem } from '../src/tree/LogsGroupItem';
import { createPortalUrl } from '../src/utils/createPortalUrl';

suite('LogsGroupItem', () => {
    const subscription: AzureSubscription = {
        name: 'Test subscription',
        subscriptionId: '11111111-1111-4111-8111-111111111141',
        tenantId: '22222222-2222-4222-8222-222222221141',
        environment: Environment.AzureCloud,
        isCustomCloud: false,
        authentication: {
            getSession: () => { throw new Error('Unexpected authentication request'); },
            getSessionWithScopes: () => { throw new Error('Unexpected authentication request'); },
        },
    };
    const resourceId = `/subscriptions/${subscription.subscriptionId}/resourceGroups/logs-test/providers/Microsoft.App`;
    const containerApp: ContainerApp = {
        id: `${resourceId}/containerApps/app`,
        location: 'eastus',
        managedEnvironmentId: `${resourceId}/managedEnvironments/environment`,
    };

    class TestLogsGroupItem extends LogsGroupItem {
        constructor(private readonly environment: ManagedEnvironment | Error) {
            super(subscription, containerApp);
        }

        protected override async getEnvironment(): Promise<ManagedEnvironment> {
            if (this.environment instanceof Error) {
                throw this.environment;
            }
            return this.environment;
        }
    }

    async function getTreeItems(item: LogsGroupItem): Promise<TreeItem[]> {
        return Promise.all((await item.getChildren()).map(child => child.getTreeItem()));
    }

    function assertStreamingItem(item: TreeItem): void {
        assert.strictEqual(item.id, `${containerApp.id}/Logs/logstream`);
        assert.strictEqual(item.contextValue, 'logStreamItem');
        assert.strictEqual(item.label, 'Connect to Log Stream...');
        assert.strictEqual(item.command?.command, 'containerApps.startStreamingLogs');
        assert.deepStrictEqual(item.command.arguments, [{ subscription, containerApp }]);
    }

    function assertPortalItem(item: TreeItem): void {
        assert.strictEqual(item.id, `${containerApp.id}/logs`);
        assert.strictEqual(item.contextValue, 'logsItem');
        assert.strictEqual(item.label, 'Open Logs');
        assert.strictEqual(item.command?.command, 'azureResourceGroups.openInPortal');
        assert.deepStrictEqual(item.command.arguments, [{
            portalUrl: createPortalUrl(subscription, `${containerApp.id}/logs`),
        }]);
    }

    test('reports failed discovery and retains streaming and portal actions without offering attachment', async () => {
        const failure = new Error('Environment discovery failed');
        const errors: unknown[] = [];
        const results: unknown[] = [];
        const errorHandler = registerErrorHandler(context => {
            if (context.callbackId === 'logsGroupItem.getChildren') {
                errors.push(context.error);
                context.errorHandling.suppressDisplay = true;
            }
        });
        const telemetryHandler = registerTelemetryHandler(context => {
            if (context.callbackId === 'logsGroupItem.getChildren') {
                results.push(context.telemetry.properties.result);
            }
        });
        try {
            const items = await getTreeItems(new TestLogsGroupItem(failure));
            assert.strictEqual(items.length, 2);
            assertStreamingItem(items[0]);
            assertPortalItem(items[1]);
            assert.deepStrictEqual(errors, [failure]);
            assert.deepStrictEqual(results, ['Failed']);
        } finally {
            errorHandler.dispose();
            telemetryHandler.dispose();
        }
    });

    for (const environmentMode of ['Express', 'WorkloadProfiles']) {
        const configurations: [string, AppLogsConfiguration | undefined, boolean][] = [
            ['Azure Monitor', { destination: 'azure-monitor' }, true],
            ['Log Analytics', { destination: 'log-analytics', logAnalyticsConfiguration: { customerId: 'test-customer' } }, true],
            ['legacy Log Analytics', { logAnalyticsConfiguration: { customerId: 'test-customer' } }, true],
            ['explicitly disabled', { destination: 'none' }, false],
            ['missing configuration', undefined, false],
            ['empty configuration', {}, false],
        ];
        for (const [description, appLogsConfiguration, configured] of configurations) {
            test(`${environmentMode}: ${description} preserves the correct Logs actions`, async () => {
                const items = await getTreeItems(new TestLogsGroupItem({ location: 'eastus', environmentMode, appLogsConfiguration }));
                assert.strictEqual(items.length, 2);
                assertStreamingItem(items[0]);
                if (configured) {
                    assertPortalItem(items[1]);
                } else {
                    assert.strictEqual(items[1].id, `${containerApp.id}/logs`);
                    assert.strictEqual(items[1].contextValue, 'logsItem');
                    assert.strictEqual(items[1].label, 'Attach Log Analytics Workspace...');
                    assert.strictEqual(items[1].command?.command, 'containerApps.connectLogAnalytics');
                    assert.deepStrictEqual(items[1].command.arguments, [{ subscription, containerApp }]);
                }
            });
        }
    }
});
