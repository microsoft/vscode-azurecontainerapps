/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectResults, type DeploymentConfigurationSettings } from "../../../extension.bundle";

export type DeployWorkspaceProjectTestConfig = DeployWorkspaceProjectTestScenario[];

export interface DeployWorkspaceProjectTestScenario {
    /**
     * The list of inputs to pass directly to `TestUserInput.runWithInputs()`
     */
    inputs: (string | RegExp)[];
    /**
     * The expected context values that should be returned after running (in the format of `DeployWorkspaceProjectResults`)
     */
    expected?: StringOrRegExpProps<DeployWorkspaceProjectResults>;
    /**
     * The expected `.vscode` settings that should be present in the workspace folder root after running
     */
    dotVSCodeSettings?: {
        containerApps: {
            deploymentConfigurations: StringOrRegExpProps<DeploymentConfigurationSettings>[]
        }
    };
}

// Allowing both string and RegExp gives us more flexibility in determining how we want to match the final return value with our expected results
type StringOrRegExpProps<T> = {
    [Prop in keyof T]: string | RegExp;
};
