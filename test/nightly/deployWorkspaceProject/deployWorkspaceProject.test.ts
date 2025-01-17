/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { type Registry } from "@azure/arm-containerregistry";
import { runWithTestActionContext } from "@microsoft/vscode-azext-dev";
import { nonNullProp, randomUtils } from "@microsoft/vscode-azext-utils";
import * as assert from "assert";
import { createAcr, createManagedEnvironment } from "../../../extension.bundle";
import { longRunningTestsEnabled } from '../../global.test';
import { resourceGroupsToDelete } from "../global.nightly.test";
import { buildParallelTestScenarios, type DwpParallelTestScenario } from './buildParallelScenarios';

let setupTask: Promise<void>;
const testScenarios: DwpParallelTestScenario[] = buildParallelTestScenarios();

suite('deployWorkspaceProject', async function (this: Mocha.Suite) {
    this.timeout(15 * 60 * 1000);

    suiteSetup(async function (this: Mocha.Context) {
        if (!longRunningTestsEnabled) {
            this.skip();
        }

        // Create a container registry & managed environment first so that we can guarantee one is always built before workspace deployment tests start.
        // This is crucial for test consistency because some resource prompts will skip if no existing resources exist to choose from
        // Creating at least one of each resource first ensures consistent reproduceability.
        setupTask = setupResources();

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

async function setupResources(): Promise<void> {
    let envResourceTask: Promise<void> | undefined;
    let managedEnvironment: ManagedEnvironment | undefined;
    try {
        envResourceTask = runWithTestActionContext('createManagedEnvironment', async context => {
            const resourceName: string = 'dwp' + randomUtils.getRandomHexString(6);
            await context.ui.runWithInputs([resourceName, 'East US'], async () => {
                managedEnvironment = await createManagedEnvironment(context);
            });
        });
    } catch (e) {
        console.error(e);
    }

    let acrResourceTask: Promise<void> | undefined;
    let registry: Registry | undefined;
    try {
        acrResourceTask = runWithTestActionContext('createContainerRegistry', async context => {
            const resourceName: string = 'dwp' + randomUtils.getRandomHexString(6);
            await context.ui.runWithInputs([resourceName, 'Basic', 'East US'], async () => {
                registry = await createAcr(context);
            });
        });
    } catch (e) {
        console.error(e);
    }

    await Promise.allSettled([envResourceTask, acrResourceTask]);

    assert.ok(managedEnvironment, 'Failed to create managed environment - skipping "deployWorkspaceProject" tests.');
    resourceGroupsToDelete.add(nonNullProp(managedEnvironment, 'name'));

    assert.ok(registry, 'Failed to create container registry - skipping "deployWorkspaceProject" tests.');
    resourceGroupsToDelete.add(nonNullProp(registry, 'name'));
}
