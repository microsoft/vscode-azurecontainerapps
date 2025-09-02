/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { longRunningLocalTestsEnabled } from "../../global.test";
import { generateAdvancedJSTestCases } from "./testCases/advancedJSTestCases";
import { generateBasicJSTestCases } from "./testCases/basicJSTestCases";
import { type DeployWorkspaceProjectTestCase } from "./testCases/DeployWorkspaceProjectTestCase";
import { generateMonoRepoAdminCredentialsTestCases } from "./testCases/monoRepoTestCases/adminCredentialsTestCases";

export interface DeployWorkspaceProjectTestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCase[];
}

export function getTestScenarios(): DeployWorkspaceProjectTestScenario[] {
    const testScenarios: DeployWorkspaceProjectTestScenario[] = [
        {
            label: 'basic-js',
            folderName: 'basic-js',
            testCases: generateBasicJSTestCases(),
        },
        {
            label: 'advanced-js',
            folderName: 'advanced-js',
            testCases: generateAdvancedJSTestCases(),
        },
        {
            label: 'monorepo-admincreds',
            folderName: 'monorepo-admincreds',
            testCases: generateMonoRepoAdminCredentialsTestCases(),
        },
    ];

    if (longRunningLocalTestsEnabled) {
        // Insufficient auth privilege to test managed identity / role assignment in our manual testing subscription.
        // Therefore, limit these tests to only run locally in personal subscriptions where user has full permission to assign roles.
        // Todo: Investigate if it makes sense to elevate remote privileges such that these tests can also be automated to run remotely.
        // dwpTestScenarios.push({
        //     label: 'monorepo-identity',
        //     folderName: 'monorepo-identity',
        //     testCases: generateMonoRepoIdentityTestCases(),
        // });
    }

    return testScenarios;
}
