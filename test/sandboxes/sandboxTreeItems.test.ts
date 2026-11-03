/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { getSandboxGroupResourceId, getSandboxResourceId, type SandboxRef } from '../../src/sandboxes/sandboxTypes';
import { SandboxGroupResourceItem } from '../../src/sandboxes/tree/SandboxGroupResourceItem';
import { SandboxItem } from '../../src/sandboxes/tree/SandboxItem';

suite('sandbox tree item guards', () => {
    const ref: SandboxRef = {
        subscriptionId: 'subscription',
        resourceGroup: 'resource-group',
        groupName: 'sandbox-group',
        region: 'eastus',
        sandboxId: 'sandbox-id',
    };

    test('recognizes sandbox items by context value', () => {
        assert.strictEqual(SandboxItem.isSandboxItem({ contextValue: 'sandboxItem;running' }), true);
        assert.strictEqual(SandboxItem.isSandboxItem({ contextValue: 'containerAppItem' }), false);
    });

    test('recognizes sandbox group items by context value', () => {
        assert.strictEqual(SandboxGroupResourceItem.isSandboxGroupResourceItem({ contextValue: 'sandboxGroupItem' }), true);
        assert.strictEqual(SandboxGroupResourceItem.isSandboxGroupResourceItem({ contextValue: 'resourceGroupItem' }), false);
    });

    test('builds revealable sandbox resource ids below the sandbox group', () => {
        const groupId = '/subscriptions/subscription/resourceGroups/resource-group/providers/Microsoft.App/sandboxGroups/sandbox-group';

        assert.strictEqual(getSandboxGroupResourceId(ref), groupId);
        assert.strictEqual(getSandboxResourceId(ref), `${groupId}/sandboxes/sandbox-id`);
    });
});
