/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from "../../../extension.bundle";
import { type StringOrRegExpProps } from "../../StringOrRegExpProps";

export type DeployWorkspaceProjectTestCases = DeployWorkspaceProjectTestCase[];

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
     * The expected results that should be returned after concluding the run
     */
    expectedResults?: StringOrRegExpProps<DeployWorkspaceProjectResults>;
    /**
     * The expected `.vscode` settings that should be present in the workspace folder root after concluding the run
     */
    expectedVSCodeWorkspaceSettings?: VSCodeWorkspaceSettings;
    /**
     * A post test callback that can be used for further verifying created resources
     */
    postTestAssertion?: (results: DeployWorkspaceProjectResults) => void | Promise<void>;
}

export interface VSCodeWorkspaceSettings {
    deploymentConfigurations?: StringOrRegExpProps<DeploymentConfigurationSettings>[];
}
