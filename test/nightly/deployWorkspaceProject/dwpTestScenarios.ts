/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectTestCase } from "./testCases/DeployWorkspaceProjectTestCase";
import { generateMonoRepoBasicTestCases } from "./testCases/monoRepoBasicTestCases";

interface DeployWorkspaceProjectTestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCase[];
}

export const dwpTestScenarios: DeployWorkspaceProjectTestScenario[] = [
    {
        label: 'monorepo',
        folderName: 'monorepo-basic',
        testCases: generateMonoRepoBasicTestCases()
    },
    // {
    //     label: 'albumapi-javascript',
    //     folderName: 'albumapi-javascript',
    //     testCases: generateAlbumApiJavaScriptTestCases()
    // }
];
