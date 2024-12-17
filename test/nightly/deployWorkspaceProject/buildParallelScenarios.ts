/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { runWithTestActionContext } from "@microsoft/vscode-azext-dev";
import * as assert from "assert";
import * as path from "path";
import { workspace, type Uri, type WorkspaceFolder } from "vscode";
import { AzExtFsExtra, deployWorkspaceProject, dwpSettingUtilsV2, ext, parseError, settingUtils, type DeploymentConfigurationSettings, type DeployWorkspaceProjectResults, type IParsedError } from "../../../extension.bundle";
import { assertStringPropsMatch, getWorkspaceFolderUri } from "../../testUtils";
import { resourceGroupsToDelete } from "../global.nightly.test";
import { dwpTestScenarios, type DeployWorkspaceProjectTestScenario } from "./dwpTestScenarios";

export interface DwpParallelTestScenario {
    title: string;
    callback(setupTask: Promise<void>): Promise<void>;
    scenario?: Promise<void>;
}

export function buildParallelTestScenarios(): DwpParallelTestScenario[] {
    return dwpTestScenarios.map(scenario => {
        return {
            title: scenario.label,
            callback: buildParallelScenarioCallback(scenario),
        };
    });
}

function buildParallelScenarioCallback(scenario: DeployWorkspaceProjectTestScenario): DwpParallelTestScenario['callback'] {
    return async (setupTask: Promise<void>) => {
        await setupTask;

        const workspaceFolderUri: Uri = getWorkspaceFolderUri(scenario.folderName);
        const rootFolder: WorkspaceFolder | undefined = workspace.getWorkspaceFolder(workspaceFolderUri);
        assert.ok(rootFolder, 'Could not retrieve root workspace folder.');

        await cleanWorkspaceFolderSettings(rootFolder);

        for (const testCase of scenario.testCases) {
            ext.outputChannel.appendLog(`[[[ *** ${scenario.label} - ${testCase.label} *** ]]]`);
            await runWithTestActionContext('deployWorkspaceProject', async context => {
                await context.ui.runWithInputs(testCase.inputs, async () => {
                    let results: DeployWorkspaceProjectResults;
                    let perr: IParsedError | undefined;
                    try {
                        results = await deployWorkspaceProject(context);
                    } catch (e) {
                        results = {};

                        perr = parseError(e);
                        console.log(perr);
                    }

                    if (testCase.resourceGroupToDelete) {
                        resourceGroupsToDelete.add(testCase.resourceGroupToDelete);
                    }

                    // Verify 'expectedErrMsg'
                    if (perr || testCase.expectedErrMsg) {
                        if (testCase.expectedErrMsg instanceof RegExp) {
                            assert.match(perr?.message ?? "", testCase.expectedErrMsg, 'DeployWorkspaceProject thrown and expected error message did not match.');
                        } else {
                            assert.strictEqual(perr?.message ?? "", testCase.expectedErrMsg, 'DeployWorkspaceProject thrown and expected error message did not match.');
                        }
                    }

                    // Verify 'expectedResults'
                    assertStringPropsMatch(results as Partial<Record<string, string>>, (testCase.expectedResults ?? {}) as Record<string, string | RegExp>, 'DeployWorkspaceProject results mismatch.');

                    // Verify 'expectedVSCodeSettings'
                    const deploymentConfigurationsV2: DeploymentConfigurationSettings[] = await dwpSettingUtilsV2.getWorkspaceDeploymentConfigurations(rootFolder) ?? [];
                    const expectedDeploymentConfigurations = testCase.expectedVSCodeSettings?.deploymentConfigurations ?? [];
                    assert.strictEqual(deploymentConfigurationsV2.length, expectedDeploymentConfigurations.length, 'DeployWorkspaceProject ".vscode" saved settings mismatch.');

                    for (const [i, expectedDeploymentConfiguration] of expectedDeploymentConfigurations.entries()) {
                        const deploymentConfiguration: DeploymentConfigurationSettings = deploymentConfigurationsV2[i] ?? {};
                        assertStringPropsMatch(deploymentConfiguration as Partial<Record<string, string>>, expectedDeploymentConfiguration, 'DeployWorkspaceProject ".vscode" saved settings mismatch.');
                    }

                    // Verify 'postTestAssertion'
                    await testCase.postTestAssertion?.(context, results, 'DeployWorkspaceProject resource settings mismatch.');
                });
            });
        }

        await cleanWorkspaceFolderSettings(rootFolder);
    }
}

async function cleanWorkspaceFolderSettings(rootFolder: WorkspaceFolder) {
    const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
    const vscodeFolderPath: string = path.dirname(settingsPath);
    if (await AzExtFsExtra.pathExists(vscodeFolderPath)) {
        await AzExtFsExtra.deleteResource(vscodeFolderPath, { recursive: true });
    }
}
