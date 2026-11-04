/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import { updateAutoSuspendPolicy } from '../../src/sandboxes/lifecyclePolicy';

suite('lifecyclePolicy', () => {
    test('defaults mode to Memory when enabling without an existing mode', () => {
        assert.deepStrictEqual(updateAutoSuspendPolicy(undefined, {
            enabled: true,
            interval: 300,
        }), {
            autoSuspend: {
                enabled: true,
                interval: 300,
                mode: 'Memory',
            },
        });
    });

    test('preserves existing lifecycle settings and auto-suspend mode', () => {
        assert.deepStrictEqual(updateAutoSuspendPolicy({
            autoSuspend: {
                enabled: false,
                interval: 300,
                mode: 'Disk',
            },
            autoDelete: {
                enabled: true,
                deleteIntervalSeconds: 3600,
            },
        }, {
            enabled: true,
            interval: 900,
        }), {
            autoSuspend: {
                enabled: true,
                interval: 900,
                mode: 'Disk',
            },
            autoDelete: {
                enabled: true,
                deleteIntervalSeconds: 3600,
            },
        });
    });

    test('only disables auto-suspend while preserving its settings', () => {
        assert.deepStrictEqual(updateAutoSuspendPolicy({
            autoSuspend: {
                enabled: true,
                interval: 1800,
                mode: 'Memory',
            },
        }, {
            enabled: false,
        }), {
            autoSuspend: {
                enabled: false,
                interval: 1800,
                mode: 'Memory',
            },
        });
    });
});
