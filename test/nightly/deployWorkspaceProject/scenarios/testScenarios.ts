/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { longRunningLocalTestsEnabled } from "../../../global.test";
import { type DeployWorkspaceProjectTestScenario } from "./DeployWorkspaceProjectTestScenario";
import { generateMonorepoAdminCredentialsTests } from "./monorepo/adminCredentialsScenario";

export function generateTestScenarios(): DeployWorkspaceProjectTestScenario[] {
    const testScenarios: DeployWorkspaceProjectTestScenario[] = [
        // {
        //     label: 'basic-js',
        //     folderName: 'basic-js',
        //     testCases: generateBasicJSTests(),
        // },
        // {
        //     label: 'advanced-js',
        //     folderName: 'advanced-js',
        //     testCases: generateAdvancedJSTestCases(),
        // },
        {
            label: 'monorepo-admincreds',
            folderName: 'monorepo-admincreds',
            testCases: generateMonorepoAdminCredentialsTests(),
        },
    ];

    if (longRunningLocalTestsEnabled) {
        // Insufficient auth privilege to test managed identity / role assignment in our manual testing subscription.
        // Therefore, limit these tests to only run locally in personal subscriptions where user has full permission to assign roles.
        // Todo: Investigate if it makes sense to elevate remote privileges such that these tests can also be automated to run remotely.
        // testScenarios.push({
        //     label: 'monorepo-identity',
        //     folderName: 'monorepo-identity',
        //     testCases: generateMonoRepoIdentityTestCases(),
        // });
    }

    return testScenarios;
}

