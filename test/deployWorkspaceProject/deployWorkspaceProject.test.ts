/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import { workspace } from 'vscode';
import { deployWorkspaceProject, dwpSettingUtilsV2, type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from '../../extension.bundle';
import { getWorkspaceFolderUri } from '../testUtils';
import { type DeployWorkspaceProjectTestConfigurations } from './config/DeployWorkspaceProjectTestConfigurations';
import { getMonoRepoBasicTestConfigurations } from './config/monoRepoBasicTestConfigurations';

interface TestCase {
    label: string;
    folderName: string;
    testConfigurations: DeployWorkspaceProjectTestConfigurations;
}

const testCases: TestCase[] = [
    {
        label: 'monorepo-basic',
        folderName: 'monorepo-basic',
        testConfigurations: getMonoRepoBasicTestConfigurations()
    }
];

suite('deployWorkspaceProject', async () => {
    for (const testCase of testCases) {
        suite(testCase.label, async () => {
            const workspaceFolderUri = getWorkspaceFolderUri(testCase.folderName);
            const rootFolder = workspace.getWorkspaceFolder(workspaceFolderUri);

            if (!rootFolder) {
                return;
            }

            for (const testConfig of testCase.testConfigurations) {
                test(testConfig.label, async () => {
                    await runWithTestActionContext('deployWorkspaceProject', async context => {
                        await context.ui.runWithInputs(testConfig.inputs, async () => {
                            const results: DeployWorkspaceProjectResults = await deployWorkspaceProject(context);

                            // Verify test results match the expected results
                            for (const key in testConfig.expectedResults) {
                                const result: string | undefined = results[key];
                                const expectedResult: string | RegExp | undefined = testConfig.expectedResults[key];

                                if (result && expectedResult instanceof RegExp) {
                                    assert.match(result, expectedResult, 'DeployWorkspaceProjectResults mismatch.');
                                } else {
                                    assert.equal(result, expectedResult, 'DeployWorkspaceProjectResults mismatch.');
                                }
                            }

                            // Verify any legacy (v1) settings (.vscode)
                            // Todo: Add any additional logic once we figure out what the test cases for this might look like (tests would be related to v1-to-v2 settings conversion)

                            // Verify any current (v2) settings (.vscode)
                            const deploymentConfigurationsV2: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];

                            for (const [i, expectedDeploymentConfiguration] of (testConfig.expectedDotVSCodeSettings?.deploymentConfigurations ?? []).entries()) {
                                const deploymentConfiguration: DeploymentConfigurationSettings = deploymentConfigurationsV2[i];

                                for (const key in expectedDeploymentConfiguration) {
                                    const result: string | undefined = deploymentConfiguration[key];
                                    const expectedResult: string | RegExp | undefined = expectedDeploymentConfiguration[key];

                                    if (result && expectedResult instanceof RegExp) {
                                        assert.match(result, expectedResult, 'DeployWorkspaceProject workspace settings (v2) mismatch.');
                                    } else {
                                        assert.equal(result, expectedResult, 'DeployWorkspaceProject workspace settings (v2) mismatch.');
                                    }
                                }
                            }
                        });
                    });
                });
            }
        });
    }
});

// Questions .vscode settings and suite teardown?
// What about suite setup?
// Can we remove the ridiculous amounts of debug console flooding that makes it hard to read output
// Discuss next steps before I am able to put up for PR?


// Combinations**
// Multiple Dockerfiles
// Single Dockerfiles
// Multiple environment variables
// Single environment variables?
// Skip for now environment variables
// Use again
