/*---------------------------------------------------------------------------------------------
*  Copyright (c) Microsoft Corporation. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { type DeployWorkspaceProjectTelemetryProps as TelemetryProps } from "../../telemetry/deployWorkspaceProjectTelemetryProps";
import { type SetTelemetryProps } from "../../telemetry/SetTelemetryProps";
import { type DeployWorkspaceProjectInternalBaseContext } from "./internal/DeployWorkspaceProjectInternalContext";

export type DeployWorkspaceProjectContext = DeployWorkspaceProjectInternalBaseContext & SetTelemetryProps<TelemetryProps>;
