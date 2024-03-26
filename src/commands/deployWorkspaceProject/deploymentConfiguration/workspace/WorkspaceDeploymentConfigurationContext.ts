/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";

export interface WorkspaceDeploymentConfigurationContext extends IContainerAppContext, DeploymentConfiguration, ExecuteActivityContext {
    deploymentConfigurationSettings?: DeploymentConfigurationSettings;
}
