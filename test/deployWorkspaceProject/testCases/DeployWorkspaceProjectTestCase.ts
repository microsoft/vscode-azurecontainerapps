/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings, type IActionContext } from "../../../extension.bundle";
import { type StringOrRegExpProps } from "../../typeUtils";

export interface DeployWorkspaceProjectTestCase {
    /**
     * Label to display when executing the test
     */
    label: string;
    /**
     * The list of inputs that will be passed directly to `TestUserInput.runWithInputs()`
     */
    inputs: (string | RegExp)[];
    /**
     * The expected results that should be returned after executing the command
     */
    expectedResults?: StringOrRegExpProps<DeployWorkspaceProjectResults>;
    /**
     * The expected `.vscode` settings that should be present in the workspace folder root after executing the command
     */
    expectedVSCodeSettings?: VSCodeSettings;
    /**
     * A post test callback that can be added for further verifying any of the created resources before final suite teardown
     */
    postTestAssertion?: PostTestAssertion;
}

export type PostTestAssertion = (context: IActionContext, results: DeployWorkspaceProjectResults, errMsg?: string) => void | Promise<void>;

export interface VSCodeSettings {
    deploymentConfigurations?: StringOrRegExpProps<DeploymentConfigurationSettings>[];
}
