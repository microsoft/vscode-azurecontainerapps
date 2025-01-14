/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { type ExecuteActivityContext } from "@microsoft/vscode-azext-utils";
import { type WorkspaceDeploymentConfigurationTelemetryProps as TelemetryProps } from "../../../../telemetry/deployWorkspaceProjectTelemetryProps";
import { type SetTelemetryProps } from "../../../../telemetry/SetTelemetryProps";
import { type IContainerAppContext } from "../../../IContainerAppContext";
import { type DeploymentConfigurationSettings } from "../../settings/DeployWorkspaceProjectSettingsV2";
import { type DeploymentConfiguration } from "../DeploymentConfiguration";

export interface WorkspaceDeploymentConfigurationBaseContext extends IContainerAppContext, DeploymentConfiguration, ExecuteActivityContext {
    deploymentConfigurationSettings?: DeploymentConfigurationSettings;
}

export type WorkspaceDeploymentConfigurationContext = WorkspaceDeploymentConfigurationBaseContext & SetTelemetryProps<TelemetryProps>;
