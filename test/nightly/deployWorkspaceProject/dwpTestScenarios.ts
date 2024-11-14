/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { longRunningLocalTestsEnabled } from "../../global.test";
import { generateAlbumApiJavaScriptTestCases } from "./testCases/albumApiJavaScriptTestCases";
import { type DeployWorkspaceProjectTestCase } from "./testCases/DeployWorkspaceProjectTestCase";
import { generateMonoRepoAdminCredentialsTestCases } from "./testCases/monoRepoTestCases/adminCredentialsTestCases";
import { generateMonoRepoIdentityTestCases } from "./testCases/monoRepoTestCases/identityTestCases";

export interface DeployWorkspaceProjectTestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCase[];
}

export function getDwpTestScenarios(): DeployWorkspaceProjectTestScenario[] {
    const dwpTestScenarios: DeployWorkspaceProjectTestScenario[] = [
        {
            label: 'albumapi-js',
            folderName: 'albumapi-js',
            testCases: generateAlbumApiJavaScriptTestCases(),
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
        dwpTestScenarios.push({
            label: 'monorepo-identity',
            folderName: 'monorepo-identity',
            testCases: generateMonoRepoIdentityTestCases(),
        });
    }

    return dwpTestScenarios;
}
