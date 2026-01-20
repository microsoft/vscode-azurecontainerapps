/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { IActionContext } from "node_modules/@microsoft/vscode-azext-utils";
import { DeployWorkspaceProjectResults } from "../../../../src/commands/deployWorkspaceProject/getDeployWorkspaceProjectResults";
import { DeploymentConfigurationSettings } from "../../../../src/commands/deployWorkspaceProject/settings/DeployWorkspaceProjectSettingsV2";
import { type StringOrRegExpProps } from "../../../typeUtils";

export interface DeployWorkspaceProjectTestScenario {
    label: string;
    folderName: string;
    testCases: DeployWorkspaceProjectTestCase[];
}

export interface DeployWorkspaceProjectTestCase {
    /**
     * Label to display when executing the test
     */
    label: string;
    /**
     * The list of inputs that will be passed to the test UI
     */
    inputs: (string | RegExp)[];
    /**
     * The expected results that should be returned after executing the command
     */
    expectedResults?: StringOrRegExpProps<DeployWorkspaceProjectResults>;
    /**
     * The expected message of the error that should be caught after executing the command
     */
    expectedErrMsg?: string | RegExp;
    /**
     * The expected `.vscode` settings that should be present in the workspace folder root after executing the command
     */
    expectedVSCodeSettings?: VSCodeSettings;
    /**
     * A post test callback that can be added for further verifying any of the created resources before final suite teardown
     */
    postTestAssertion?: PostTestAssertion;
    /**
     * The name of the resource group to delete after long running tests have concluded
     */
    resourceGroupToDelete?: string;
}

export type PostTestAssertion = (context: IActionContext, results: DeployWorkspaceProjectResults, errMsg?: string) => void | Promise<void>;

export interface VSCodeSettings {
    deploymentConfigurations?: StringOrRegExpProps<DeploymentConfigurationSettings>[];
}
