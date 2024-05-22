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

                            const deploymentConfigurationsV2: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];
                            for (const [i, expectedDeploymentConfiguration] of (testCase.expectedVSCodeWorkspaceSettings?.deploymentConfigurations ?? []).entries()) {
                                const deploymentConfiguration: DeploymentConfigurationSettings = deploymentConfigurationsV2[i] ?? {};
                                assertFlexibleDeepEqual(deploymentConfiguration as Partial<Record<string, string>>, expectedDeploymentConfiguration, 'DeployWorkspaceProject workspace settings (v2) mismatch.');
                            }

                            await testCase.postTestAssertion?.(results);
                        });
                    });
                });
            }
        });
    }
});
