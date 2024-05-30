/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectTestCase } from "./testCases/DeployWorkspaceProjectTestCase";
import { generateAlbumApiJavaScriptTestCases } from "./testCases/albumApiJavaScript";

interface TestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCase[];
}

export const testScenarios: TestScenario[] = [
    // {
    //     label: 'monorepo-basic',
    //     folderName: 'monorepo-basic',
    //     testCases: generateMonoRepoBasicTestCases()
    // },
    {
        label: 'albumapi-javascript',
        folderName: 'albumapi-javascript',
        testCases: generateAlbumApiJavaScriptTestCases()
    }
];
