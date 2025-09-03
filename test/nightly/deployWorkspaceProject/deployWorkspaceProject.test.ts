/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { nonNullProp } from "@microsoft/vscode-azext-utils";
import { longRunningTestsEnabled } from "../../global.test";
import { generateParallelTests, type DwpParallelTestScenario } from "./parallelTests";

const testScenarios: DwpParallelTestScenario[] = generateParallelTests();

suite('deployWorkspaceProject', async function (this: Mocha.Suite) {
    this.timeout(15 * 60 * 1000);

    suiteSetup(async function (this: Mocha.Context) {
        if (!longRunningTestsEnabled) {
            this.skip();
        }

        for (const s of testScenarios) {
            s.scenario = s.callback();
        }
    });

    for (const s of testScenarios) {
        test(s.title, async function () {
            await nonNullProp(s, 'scenario');
        });
    }
});
