/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectTestCase } from "./testCases/DeployWorkspaceProjectTestCase";
import { generateMonoRepoBasicTestCases } from "./testCases/monoRepoBasicTestCases";
import { generateMsLearnJsTestCases } from "./testCases/msLearnJsTestCases";

interface TestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCase[];
}

export const testScenarios: TestScenario[] = [
    {
        label: 'monorepo',
        folderName: 'monorepo-basic',
        testCases: generateMonoRepoBasicTestCases()
    },
    {
        label: 'mslearn-js',
        folderName: 'mslearn-js',
        testCases: generateMsLearnJsTestCases()
    }
];
