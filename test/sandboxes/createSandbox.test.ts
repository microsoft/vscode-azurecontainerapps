/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { createSandboxGroupRef, isCreateSandboxCommandInput, type CreateSandboxCommandInput } from '../../src/sandboxes/sandboxTypes';

const input: CreateSandboxCommandInput = {
    resourceId: '/subscriptions/subscription-1/resourceGroups/resource-group-1/providers/Microsoft.App/sandboxGroups/sandbox-group-1',
    location: 'westus2',
};

suite('createSandbox command input', () => {
    test('accepts a serializable sandbox group reference', () => {
        assert.strictEqual(isCreateSandboxCommandInput(input), true);
        assert.deepStrictEqual(createSandboxGroupRef(input), {
            subscriptionId: 'subscription-1',
            resourceGroup: 'resource-group-1',
            groupName: 'sandbox-group-1',
            region: 'westus2',
        });
    });

    test('rejects incomplete sandbox group references', () => {
        assert.strictEqual(isCreateSandboxCommandInput({ ...input, location: '' }), false);
        assert.strictEqual(isCreateSandboxCommandInput({ ...input, resourceId: '' }), false);
        assert.strictEqual(isCreateSandboxCommandInput({ ...input, resourceId: '/subscriptions/subscription-1/resourceGroups/resource-group-1' }), false);
        assert.strictEqual(isCreateSandboxCommandInput(undefined), false);
    });

});
