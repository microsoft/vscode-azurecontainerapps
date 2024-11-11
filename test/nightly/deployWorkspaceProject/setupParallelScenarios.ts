/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ManagedEnvironment } from "@azure/arm-appcontainers";
import { runWithTestActionContext } from "@microsoft/vscode-azext-dev";
import * as assert from "assert";
import * as path from "path";
import { workspace, type Uri, type WorkspaceFolder } from "vscode";
import { AzExtFsExtra, createManagedEnvironment, deployWorkspaceProject, dwpSettingUtilsV2, nonNullProp, parseError, randomUtils, settingUtils, type DeploymentConfigurationSettings, type DeployWorkspaceProjectResults, type IParsedError } from "../../../extension.bundle";
import { assertStringPropsMatch, getWorkspaceFolderUri } from "../../testUtils";
import { resourceGroupsToDelete } from "../global.nightly.test";
import { dwpTestScenarios, type DeployWorkspaceProjectTestScenario } from "./dwpTestScenarios";

export interface ParallelScenarios {
    title: string;
    callback(): Promise<void>;
    scenario?: Promise<void>;
}

export async function getParallelScenarios(): Promise<ParallelScenarios[]> {
    // Create a managed environment first so that we can guarantee one is always built before workspace deployment tests start.
    // This is crucial for test consistency because the managed environment prompt will skip if no managed environment
    // resources are available yet. Creating at least one environment first ensures consistent reproduceability.
    const managedEnvironment: ManagedEnvironment | undefined = await setupManagedEnvironment();
    if (!managedEnvironment) {
        return [{
            title: "Deploy workspace project setup",
            callback: async () => {
                test("Should create precursor managed environment", () => {
                    assert.ok(managedEnvironment, 'Failed to create managed environment - skipping "deployWorkspaceProject" tests.');
                });
            }
        }];
    }
    resourceGroupsToDelete.add(nonNullProp(managedEnvironment, 'name'));

    return dwpTestScenarios.map(scenario => {
        return {
            title: scenario.label,
            callback: getParallelScenarioCallback(scenario),
        };
    });
}

function getParallelScenarioCallback(scenario: DeployWorkspaceProjectTestScenario): () => Promise<void> {
    return async () => {
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
            });
        }
    }
}

async function setupManagedEnvironment(): Promise<ManagedEnvironment | undefined> {
    let managedEnvironment: ManagedEnvironment | undefined;
    await runWithTestActionContext('createManagedEnvironment', async context => {
        const resourceName: string = 'dwp' + randomUtils.getRandomHexString(6);
        await context.ui.runWithInputs([resourceName, 'East US'], async () => {
            managedEnvironment = await createManagedEnvironment(context);
        });
    });
    return managedEnvironment;
}

function getMethodCleanWorkspaceFolderSettings(rootFolder: WorkspaceFolder) {
    return async function cleanWorkspaceFolderSettings(): Promise<void> {
        const settingsPath: string = settingUtils.getDefaultRootWorkspaceSettingsPath(rootFolder);
        const vscodeFolderPath: string = path.dirname(settingsPath);
        if (await AzExtFsExtra.pathExists(vscodeFolderPath)) {
            await AzExtFsExtra.deleteResource(vscodeFolderPath, { recursive: true });
        }
    }
}
