/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectTestCases } from "./testCases/DeployWorkspaceProjectTestCases";
import { getMonoRepoBasicTestCases } from "./testCases/monoRepoBasic";

interface TestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCases;
}

export const testScenarios: TestScenario[] = [
    {
        label: 'monorepo-basic',
        folderName: 'monorepo-basic',
        testCases: getMonoRepoBasicTestCases()
    }
];
