/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from '@microsoft/vscode-azext-dev';
import * as assert from 'assert';
import * as path from 'path';
import { workspace, type Uri, type WorkspaceFolder } from 'vscode';
import { AzExtFsExtra, deployWorkspaceProject, dwpSettingUtilsV2, settingUtils, type DeploymentConfigurationSettings, type DeployWorkspaceProjectResults } from '../../../extension.bundle';
import { longRunningTestsEnabled } from '../../global.test';
import { assertStringPropsMatch, getWorkspaceFolderUri } from '../../testUtils';
import { resourceGroupsToDelete } from '../global.nightly.test';
import { dwpTestScenarios } from './dwpTestScenarios';

suite('deployWorkspaceProject', function (this: Mocha.Suite) {
    this.timeout(15 * 60 * 1000);

    suiteSetup(function (this: Mocha.Context) {
        if (!longRunningTestsEnabled) {
            this.skip();
        }
    });

    for (const scenario of dwpTestScenarios) {
        suite(scenario.label, function () {
            const workspaceFolderUri: Uri = getWorkspaceFolderUri(scenario.folderName);
            const rootFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(workspaceFolderUri);
            assert.ok(rootFolder, 'Could not retrieve root workspace folder.');

            suiteSetup(getMethodCleanWorkspaceFolderSettings(rootFolder));
            suiteTeardown(getMethodCleanWorkspaceFolderSettings(rootFolder));

            for (const testCase of scenario.testCases) {
                test(testCase.label, async function () {
                    await runWithTestActionContext('deployWorkspaceProject', async context => {
                        await context.ui.runWithInputs(testCase.inputs, async () => {
                            let results: DeployWorkspaceProjectResults;
                            try {
                                results = await deployWorkspaceProject(context);
                            } catch {
                                results = {};
                            }

                            if (testCase.resourceGroupToDelete) {
                                resourceGroupsToDelete.add(testCase.resourceGroupToDelete);
                            }

                            assertStringPropsMatch(results as Partial<Record<string, string>>, (testCase.expectedResults ?? {}) as Record<string, string | RegExp>, 'DeployWorkspaceProject results mismatch.');

                            const deploymentConfigurationsV2: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];
                            const expectedDeploymentConfigurations = testCase.expectedVSCodeSettings?.deploymentConfigurations ?? [];
                            assert.strictEqual(deploymentConfigurationsV2.length, expectedDeploymentConfigurations.length, 'DeployWorkspaceProject ".vscode" saved settings mismatch.');

                            for (const [i, expectedDeploymentConfiguration] of expectedDeploymentConfigurations.entries()) {
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

function getMethodCleanWorkspaceFolderSettings(rootFolder: WorkspaceFolder) {
    return async function cleanWorkspaceFolderSettings(): Promise<void> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        const vscodeFolderPath: string = path.dirname(settingsPath);
        if (await AzExtFsExtra.pathExists(vscodeFolderPath)) {
            await AzExtFsExtra.deleteResource(vscodeFolderPath, { recursive: true });
        }
    }
}

