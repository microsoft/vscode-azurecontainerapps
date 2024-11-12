/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { runWithTestActionContext } from "@microsoft/vscode-azext-dev";
import { nonNullProp, randomUtils } from "@microsoft/vscode-azext-utils";
import * as assert from "assert";
import { createManagedEnvironment } from "../../../extension.bundle";
import { longRunningTestsEnabled } from '../../global.test';
import { resourceGroupsToDelete } from "../global.nightly.test";
import { getParallelTestScenarios, type DwpParallelTestScenario } from './getParallelScenarios';

let setupTask: Promise<void>;
const testScenarios: DwpParallelTestScenario[] = getParallelTestScenarios();

suite('deployWorkspaceProject', async function (this: Mocha.Suite) {
    this.timeout(15 * 60 * 1000);

    suiteSetup(async function (this: Mocha.Context) {
        if (!longRunningTestsEnabled) {
            this.skip();
        }

        // Create a managed environment first so that we can guarantee one is always built before workspace deployment tests start.
        // This is crucial for test consistency because the managed environment prompt will skip if no managed environment
        // resources are available yet. Creating at least one environment first ensures consistent reproduceability.
        setupTask = setupManagedEnvironment();

        for (const s of testScenarios) {
            s.scenario = s.callback(setupTask);
        }
    });

    for (const s of testScenarios) {
        test(s.title, async function () {
            await nonNullProp(s, 'scenario');
        });
    }
});

async function setupManagedEnvironment(): Promise<void> {
    let managedEnvironment: ManagedEnvironment | undefined;
    try {
        await runWithTestActionContext('createManagedEnvironment', async context => {
            const resourceName: string = 'dwp' + randomUtils.getRandomHexString(6);
            await context.ui.runWithInputs([resourceName, 'East US'], async () => {
                managedEnvironment = await createManagedEnvironment(context);
            });
        });
    } catch { /** Do nothing */ }

    if (!managedEnvironment) {
        assert.ok(managedEnvironment, 'Failed to create managed environment - skipping "deployWorkspaceProject" test.');
    }
    resourceGroupsToDelete.add(nonNullProp(managedEnvironment, 'name'));
}
