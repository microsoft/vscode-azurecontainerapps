/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type WorkspaceFolder } from "vscode";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";

export interface WorkspaceDeploymentConfigurationContext extends IContainerAppContext {
    rootFolder?: WorkspaceFolder;
    deploymentConfigurationSettings?: DeploymentConfigurationSettings;
}
