/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import { workspace, type Uri, type WorkspaceFolder } from 'vscode';
import { deployWorkspaceProject, dwpSettingUtilsV2, type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from '../../extension.bundle';
import { assertFlexibleDeepEqual, getWorkspaceFolderUri } from '../testUtils';
import { testScenarios } from './testScenarios';

suite('deployWorkspaceProject', async () => {
    for (const scenario of testScenarios) {
        suite(scenario.label, async () => {
            const workspaceFolderUri: Uri = getWorkspaceFolderUri(scenario.folderName);
            const rootFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(workspaceFolderUri);
            assert.ok(rootFolder, 'Could not retrieve root workspace folder.');

            for (const testCase of scenario.testCases) {
                test(testCase.label, async () => {
                    await runWithTestActionContext('deployWorkspaceProject', async context => {
                        await context.ui.runWithInputs(testCase.inputs, async () => {
                            const results: DeployWorkspaceProjectResults = await deployWorkspaceProject(context);
                            assertFlexibleDeepEqual(results as Partial<Record<string, string>>, testCase.expectedResults as Record<string, string | RegExp>, 'DeployWorkspaceProject results mismatch.');

                            const deploymentConfigurationsV2: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];
                            for (const [i, expectedDeploymentConfiguration] of (testCase.expectedVSCodeSettings?.deploymentConfigurations ?? []).entries()) {
                                const deploymentConfiguration: DeploymentConfigurationSettings = deploymentConfigurationsV2[i] ?? {};
                                assertFlexibleDeepEqual(deploymentConfiguration as Partial<Record<string, string>>, expectedDeploymentConfiguration, 'DeployWorkspaceProject ".vscode" settings mismatch.');
                            }

                            await testCase.postTestAssertion?.(context, results, 'DeployWorkspaceProject resource settings mismatch.');
                        });
                    });
                });
            }
        });
    }
});
