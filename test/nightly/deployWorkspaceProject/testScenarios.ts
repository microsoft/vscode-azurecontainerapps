/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { generateAlbumApiJavaScriptTestCases } from "./testCases/albumApiJavaScriptTestCases";
import { type DeployWorkspaceProjectTestCase } from "./testCases/DeployWorkspaceProjectTestCase";
import { generateMonoRepoBasicTestCases } from "./testCases/monoRepoBasicTestCases";

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
        label: 'albumapi-js',
        folderName: 'albumapi-js',
        testCases: generateAlbumApiJavaScriptTestCases()
    }
];
