/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import { workspace } from 'vscode';
import { deployWorkspaceProject, dwpSettingUtilsV2, type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from '../../extension.bundle';
import { assertFlexibleDeepEqual, getWorkspaceFolderUri } from '../testUtils';
import { testScenarios } from './testScenarios';

suite('deployWorkspaceProject', async () => {
    for (const scenario of testScenarios) {
        suite(scenario.label, async () => {
            const workspaceFolderUri = getWorkspaceFolderUri(scenario.folderName);
            const rootFolder = workspace.getWorkspaceFolder(workspaceFolderUri);

            if (!rootFolder) {
                return;
            }

            for (const testCase of scenario.testCases) {
                test(testCase.label, async () => {
                    await runWithTestActionContext('deployWorkspaceProject', async context => {
                        await context.ui.runWithInputs(testCase.inputs, async () => {
                            const results: DeployWorkspaceProjectResults = await deployWorkspaceProject(context);
                            assertFlexibleDeepEqual(results as Partial<Record<string, string>>, testCase.expectedResults as Record<string, string | RegExp>, 'DeployWorkspaceProjectResults mismatch.');

                            // Verify any legacy (v1) settings (.vscode)
                            // Todo: Add any additional logic once we figure out what the test cases for this might look like (tests would be related to v1-to-v2 settings conversion)

                            // Verify any current (v2) settings (.vscode)
                            const deploymentConfigurationsV2: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];

                            for (const [i, expectedDeploymentConfiguration] of (testCase.expectedDotVSCodeSettings?.deploymentConfigurations ?? []).entries()) {
                                const deploymentConfiguration: DeploymentConfigurationSettings = deploymentConfigurationsV2[i] ?? {};
                                assertFlexibleDeepEqual(deploymentConfiguration as Partial<Record<string, string>>, expectedDeploymentConfiguration, 'DeployWorkspaceProject workspace settings (v2) mismatch.');
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
