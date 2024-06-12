/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import * as path from 'path';
import { workspace, type Uri, type WorkspaceFolder } from 'vscode';
import { AzExtFsExtra, deployWorkspaceProject, dwpSettingUtilsV2, settingUtils, type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from '../../extension.bundle';
import { assertStringPropsMatch, getWorkspaceFolderUri } from '../testUtils';
import { testScenarios } from './testScenarios';

suite('deployWorkspaceProject', async () => {

    for (const scenario of testScenarios) {
        suite(scenario.label, async () => {
            const workspaceFolderUri: Uri = getWorkspaceFolderUri(scenario.folderName);
            const rootFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(workspaceFolderUri);
            assert.ok(rootFolder, 'Could not retrieve root workspace folder.');

            suiteTeardown(async function removeWorkspaceSettings() {
                const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
                const vscodeFolderPath: string = path.dirname(settingsPath);
                if (await AzExtFsExtra.pathExists(vscodeFolderPath)) {
                    AzExtFsExtra.deleteResource(vscodeFolderPath, { recursive: true });
                }
            });

            for (const testCase of scenario.testCases) {
                test(testCase.label, async () => {
                    await runWithTestActionContext('deployWorkspaceProject', async context => {
                        await context.ui.runWithInputs(testCase.inputs, async () => {
                            const results: DeployWorkspaceProjectResults = await deployWorkspaceProject(context);
                            assertStringPropsMatch(results as Partial<Record<string, string>>, testCase.expectedResults as Record<string, string | RegExp>, 'DeployWorkspaceProject results mismatch.');

                            const deploymentConfigurationsV2: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];
                            for (const [i, expectedDeploymentConfiguration] of (testCase.expectedVSCodeSettings?.deploymentConfigurations ?? []).entries()) {
                                const deploymentConfiguration: DeploymentConfigurationSettings = deploymentConfigurationsV2[i] ?? {};
                                assertStringPropsMatch(deploymentConfiguration as Partial<Record<string, string>>, expectedDeploymentConfiguration, 'DeployWorkspaceProject ".vscode" saved settings mismatch.');
                            }

                            await testCase.postTestAssertion?.(context, results, 'DeployWorkspaceProject resource settings mismatch.');
                        });
                    });
                });
            }
        });
    }
});
