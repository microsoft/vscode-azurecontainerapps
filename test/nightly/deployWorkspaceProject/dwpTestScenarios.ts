/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { generateAlbumApiJavaScriptTestCases } from "./testCases/albumApiJavaScriptTestCases";
import { type DeployWorkspaceProjectTestCase } from "./testCases/DeployWorkspaceProjectTestCase";
import { generateMonoRepoBasicTestCases } from "./testCases/monoRepoBasicTestCases";

export interface DeployWorkspaceProjectTestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCase[];
}

export const dwpTestScenarios: DeployWorkspaceProjectTestScenario[] = [
    {
        label: 'albumapi-js',
        folderName: 'albumapi-js',
        testCases: generateAlbumApiJavaScriptTestCases()
    },
    {
        label: 'monorepo',
        folderName: 'monorepo-basic',
        testCases: generateMonoRepoBasicTestCases()
    },
];
